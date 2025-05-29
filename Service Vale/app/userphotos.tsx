import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    Pressable,
    Dimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { databases, storage, account } from '../lib/appwrite';
import { Query, Models } from 'appwrite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../constants/Userphoto';

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
    const router = useRouter();

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
            Alert.alert('Error', 'Failed to load data.');
        } finally {
            setIsLoading(false);
        }
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

            const saveImage = async (fileId: string | undefined) => {
                if (!fileId) return null;
                const uri = buildImageUrl(fileId);
                const localPath = `${FileSystem.cacheDirectory}${fileId}.jpg`;
                const downloaded = await FileSystem.downloadAsync(uri, localPath);
                const asset = await MediaLibrary.createAssetAsync(downloaded.uri);
                return asset;
            };

            const beforeAsset = await saveImage(item.beforeImageUrl);
            const afterAsset = await saveImage(item.afterImageUrl);

            if (beforeAsset || afterAsset) {
                await MediaLibrary.createAlbumAsync('MyApp Images', beforeAsset ?? afterAsset as MediaLibrary.Asset, false);
            }

            if (item.beforeImageUrl) {
                await storage.deleteFile(BUCKET_ID, item.beforeImageUrl);
            }
            if (item.afterImageUrl) {
                await storage.deleteFile(BUCKET_ID, item.afterImageUrl);
            }

            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, item.$id);

            Alert.alert('Success', 'Images saved to gallery and deleted from backend.');
            fetchPhotoSets();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6B46C1" />
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.authContainer}>
                <Text>Please login to view your progress photos.</Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                    <Text style={{ color: '#3498db' }}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Progress Tracker</Text>
            {photoSets.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>No photos yet.</Text>
            ) : (
                photoSets.map((item) => (
                    <View key={item.$id} style={styles.card}>
                        <Text style={styles.date}>
                            {new Date(item.date).toLocaleString()}
                        </Text>
                        <View style={styles.imageRow}>
                            <View style={styles.imageContainer}>
                                <Text>Before</Text>
                                {item.beforeImageUrl ? (
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (item.beforeImageUrl) {
                                                openPreview(buildImageUrl(item.beforeImageUrl));
                                            }
                                        }}
                                    >
                                        <Image
                                            source={{ uri: buildImageUrl(item.beforeImageUrl) }}
                                            style={styles.image}
                                        />
                                    </TouchableOpacity>
                                ) : (
                                    <Text>No Image</Text>
                                )}
                            </View>
                            <View style={styles.imageContainer}>
                                <Text>After</Text>
                                {item.afterImageUrl ? (
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (item.afterImageUrl) {
                                                openPreview(buildImageUrl(item.afterImageUrl));
                                            }
                                        }}
                                    >
                                        <Image
                                            source={{ uri: buildImageUrl(item.afterImageUrl) }}
                                            style={styles.image}
                                        />
                                    </TouchableOpacity>
                                ) : (
                                    <Text>No Image</Text>
                                )}
                            </View>
                        </View>
                        {item.notes && <Text style={styles.notes}>Notes: {item.notes}</Text>}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => saveBothImagesAndDelete(item)}
                        >
                            <Text style={styles.buttonText}>Save to Gallery & Delete</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}

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
        </ScrollView>
    );
};

export default PhotoComparisonPage;

