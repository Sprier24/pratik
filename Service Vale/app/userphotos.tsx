import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Pressable, Dimensions, SafeAreaView, RefreshControl } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { databases, storage, account } from '../lib/appwrite';
import { Query, Models } from 'appwrite';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';
import { styles } from '../constants/Userphoto';
import { footerStyles } from '../constants/footer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PhotoDocument extends Models.Document {
    beforeImageUrl?: string;
    afterImageUrl?: string;
    date: string;
    notes?: string;
}

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'photo_id';
const BUCKET_ID = 'photo_id';
const { width } = Dimensions.get('window');
const STORAGE_BASE_URL = 'https://fra.cloud.appwrite.io/v1/storage/buckets/photo_id/files';
const PROJECT_ID = '681b300f0018fdc27bdd';

const buildImageUrl = (fileId: string) =>
    `${STORAGE_BASE_URL}/${fileId}/view?project=${PROJECT_ID}&mode=admin`;

const PhotoComparisonPage: React.FC = () => {
    const [photoSets, setPhotoSets] = useState<PhotoDocument[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [previewVisible, setPreviewVisible] = useState<boolean>(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchPhotoSets();
    }, [isAuthenticated]);

    const checkAuthStatus = async () => {
        setIsLoading(true);
        try {
            const user = await account.get();
            setIsAuthenticated(!!user?.$id);
        } catch {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPhotoSets = async () => {
        setIsLoading(true);
        try {
            const res = await databases.listDocuments<PhotoDocument>(
                DATABASE_ID,
                COLLECTION_ID,
                [Query.orderDesc('date'), Query.limit(50)]
            );
            setPhotoSets(res.documents);
        } catch {
            Alert.alert('Error', 'Failed to load photos.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPhotoSets();
    };

    const openPreview = (uri: string) => {
        setPreviewImageUrl(uri);
        setPreviewVisible(true);
    };

    const closePreview = () => {
        setPreviewVisible(false);
        setPreviewImageUrl(null);
    };

    const saveBothImagesAndDelete = async (item: PhotoDocument) => {
        setIsLoading(true);
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Cannot access gallery.');
                setIsLoading(false);
                return;
            }
            const saveImageToGallery = async (fileId?: string) => {
                if (!fileId) return;
                const fileUrl = buildImageUrl(fileId);
                const localPath = `${FileSystem.cacheDirectory}${fileId}.jpg`;
                const downloadResult = await FileSystem.downloadAsync(fileUrl, localPath);
                await MediaLibrary.createAssetAsync(downloadResult.uri);
            };
            await saveImageToGallery(item.beforeImageUrl);
            await saveImageToGallery(item.afterImageUrl);
            if (item.beforeImageUrl) {
                await storage.deleteFile(BUCKET_ID, item.beforeImageUrl);
            }
            if (item.afterImageUrl) {
                await storage.deleteFile(BUCKET_ID, item.afterImageUrl);
            }
            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, item.$id);
            Alert.alert('Success', 'Images saved to Gallery (DCIM) and deleted from backend.');
            fetchPhotoSets();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save or delete images.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5E72E4" />
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.authContainer}>
                <Text style={styles.authText}>Please login to view service photos</Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.push('/login')}
                >
                    <Text style={styles.loginButtonText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.push('/home')}>
                        <Feather name="arrow-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Service Photos</Text>
                </View>
            </View>
            <ScrollView
                contentContainerStyle={[styles.scrollContainer, { paddingBottom: 150 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#5E72E4']}
                        tintColor={'#5E72E4'}
                    />
                }
            >
                {photoSets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="photo-library" size={48} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No service photos yet</Text>
                    </View>
                ) : (
                    photoSets.map((item) => (
                        <View key={item.$id} style={styles.photoCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.dateBadge}>
                                    <MaterialIcons name="date-range" size={16} color="#FFF" />
                                    <Text style={styles.dateText}>
                                        {new Date(item.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.photoGrid}>
                                <View style={styles.photoContainer}>
                                    <Text style={styles.photoLabel}>Before</Text>
                                    {item.beforeImageUrl ? (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (item.beforeImageUrl) {
                                                    openPreview(buildImageUrl(item.beforeImageUrl));
                                                }
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Image
                                                source={{ uri: buildImageUrl(item.beforeImageUrl) }}
                                                style={styles.photoImage}
                                            />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.placeholder}>
                                            <MaterialIcons name="image-not-supported" size={32} color="#A0AEC0" />
                                            <Text style={styles.placeholderText}>No image</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.photoContainer}>
                                    <Text style={styles.photoLabel}>After</Text>
                                    {item.afterImageUrl ? (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (item.afterImageUrl) {
                                                    openPreview(buildImageUrl(item.afterImageUrl));
                                                }
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Image
                                                source={{ uri: buildImageUrl(item.afterImageUrl) }}
                                                style={styles.photoImage}
                                            />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.placeholder}>
                                            <MaterialIcons name="image-not-supported" size={32} color="#A0AEC0" />
                                            <Text style={styles.placeholderText}>No image</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {item.notes && (
                                <View style={styles.notesBadge}>
                                    <Text style={styles.notesText}>
                                        {[...new Set(item.notes.split('\n'))].join('\n')}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => saveBothImagesAndDelete(item)}
                                disabled={isLoading}
                            >
                                <MaterialIcons name="save-alt" size={20} color="#FFF" />
                                <Text style={styles.actionButtonText}>Save & Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={previewVisible} transparent animationType="fade">
                <Pressable style={styles.modalBackground} onPress={closePreview}>
                    {previewImageUrl && (
                        <Image
                            source={{ uri: previewImageUrl }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                    <TouchableOpacity style={styles.closeButton} onPress={closePreview}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                </Pressable>
            </Modal>

            <View style={[footerStyles.bottomBar, { paddingBottom: insets.bottom || 20, marginTop: 40 }]}>
                <TouchableOpacity
                    style={footerStyles.bottomButton}
                    onPress={() => router.push('/service')}
                >
                    <View style={footerStyles.bottomButtonIcon}>
                        <MaterialIcons name="car-repair" size={20} color="#5E72E4" />
                    </View>
                    <Text style={footerStyles.bottomButtonText}>Service</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={footerStyles.bottomButton}
                    onPress={() => router.push('/user')}
                >
                    <View style={footerStyles.bottomButtonIcon}>
                        <MaterialIcons name="person" size={20} color="#5E72E4" />
                    </View>
                    <Text style={footerStyles.bottomButtonText}>Users</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[footerStyles.bottomButton]}
                    onPress={() => router.push('/home')}
                >
                    <View style={[footerStyles.bottomButtonIcon]}>
                        <Feather name="home" size={20} color="#5E72E4" />
                    </View>
                    <Text style={[footerStyles.bottomButtonText]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[footerStyles.bottomButton, footerStyles.bottomButtonActive]}
                    onPress={() => router.push('/userphotos')}
                >
                    <View style={[footerStyles.bottomButtonIcon, footerStyles.bottomButtonIconActive]}>
                        <MaterialIcons name="photo-library" size={20} color="#FFF" />
                    </View>
                    <Text style={[footerStyles.bottomButtonText, footerStyles.bottomButtonTextActive]}>Photos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={footerStyles.bottomButton}
                    onPress={() => router.push('/bill')}
                >
                    <View style={footerStyles.bottomButtonIcon}>
                        <Feather name="file-text" size={20} color="#5E72E4" />
                    </View>
                    <Text style={footerStyles.bottomButtonText}>Bills</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default PhotoComparisonPage;