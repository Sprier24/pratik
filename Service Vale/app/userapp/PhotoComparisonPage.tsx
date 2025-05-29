import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    StyleSheet,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Dimensions,
    TextInput,
    Modal,
    Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { databases, storage, account } from '../../lib/appwrite';
import { ID } from 'appwrite';
import { Query } from 'appwrite';
import { useRouter } from 'expo-router';
import mime from 'mime';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'photo_id';
const NOTIFICATIONS_COLLECTION = 'note_id';
const BUCKET_ID = 'photo_id';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const STORAGE_BASE_URL = 'https://fra.cloud.appwrite.io/v1/storage/buckets/photo_id/files';
const PROJECT_ID = '681b300f0018fdc27bdd';

const buildImageUrl = (fileId: string) =>
    `${STORAGE_BASE_URL}/${fileId}/view?project=${PROJECT_ID}&mode=admin`;

type ImagePickerResult = {
    uri: string;
    fileName?: string;
    fileSize?: number;
    type?: string;
};

type PhotoSet = {
    $id: string;
    beforeImageUrl: string;
    afterImageUrl: string;
    notes?: string;
    date: string;
};

const PhotoComparisonPage = () => {
    const [beforeImage, setBeforeImage] = useState<ImagePickerResult | null>(null);
    const [afterImage, setAfterImage] = useState<ImagePickerResult | null>(null);
    const { notes: initialNotes } = useLocalSearchParams();
    const [notes, setNotes] = useState(
        Array.isArray(initialNotes) ? initialNotes.join(', ') : initialNotes || ''
    );
    const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState('');

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
            setUserEmail(user.email);
        } catch (error) {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };


    const fetchPhotoSets = async () => {
        setIsLoading(true);
        try {
            const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
                Query.equal('userEmail', userEmail),
                Query.orderDesc('date'),
                Query.limit(20),
            ]);

            const safeDocs: PhotoSet[] = response.documents.map((doc: any) => ({
                $id: doc.$id,
                beforeImageUrl: doc.beforeImageUrl,
                afterImageUrl: doc.afterImageUrl,
                notes: doc.notes,
                date: doc.date,
            }));

            setPhotoSets(safeDocs);
        } catch (error) {
            Alert.alert('Error', 'Failed to load photos.');
        } finally {
            setIsLoading(false);
        }
    };


    const takePhoto = async (setImage: (image: ImagePickerResult | null) => void) => {
        if (!isAuthenticated) {
            Alert.alert('Login Required', 'Please log in to upload photos');
            router.push('/login');
            return;
        }

        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
            Alert.alert('Permission Denied', 'Camera access is required');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
        });

        if (!result.canceled && result.assets.length > 0) {
            const asset = result.assets[0];
            setImage({
                uri: asset.uri,
                fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
                fileSize: asset.fileSize ?? 0,
                type: asset.type ?? 'image/jpeg',
            });
        }
    };

    const uploadImageToStorage = async (image: ImagePickerResult): Promise<string> => {
        try {
            const uri = image.uri;
            const name = image.fileName ?? `photo_${Date.now()}.jpg`;
            const type = mime.getType(uri) || 'image/jpeg';

            const file = {
                uri,
                name,
                type,
                size: image.fileSize ?? 0,
            };

            const uploadedFile = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                file
            );

            if (!uploadedFile || !uploadedFile.$id) {
                throw new Error('File upload returned an invalid response');
            }

            return uploadedFile.$id;
        } catch (error) {
            throw new Error('Failed to upload image. Check Appwrite settings.');
        }
    };

    const createNotification = async (description: string, documentId: string) => {
        const notifId = ID.unique();

        try {
            await databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION, notifId, {
                description,

                isRead: false,
                createdAt: new Date().toISOString(),
            });
            console.log('Notification created:', notifId);
        } catch (error: any) {
            console.error('Failed to create notification:', error.message || error);
            Alert.alert(
                'Notification Error',
                'Failed to save notification. Please check Appwrite console or database permissions.'
            );
        }
    };


    const handleSubmit = async () => {
        if (!isAuthenticated) {
            Alert.alert('Login Required', 'Please log in first.');
            router.push('/login');
            return;
        }

        if (!beforeImage && !afterImage) {
            Alert.alert('Missing Image', 'Take at least one photo.');
            return;
        }

        setIsUploading(true);

        try {
            if (beforeImage && !afterImage) {
                const beforeFileId = await uploadImageToStorage(beforeImage);
                const docId = ID.unique();

                await databases.createDocument(DATABASE_ID, COLLECTION_ID, docId, {
                    beforeImageUrl: beforeFileId,
                    afterImageUrl: '',
                    notes,
                    date: new Date().toISOString(),
                    userEmail: userEmail,
                });

                await createNotification(
                    `Photo added to pending service. Notes: ${notes || 'No notes provided'}`,
                    docId
                );
            } else if (afterImage && !beforeImage) {
                const afterFileId = await uploadImageToStorage(afterImage);
                const latest = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
                    Query.orderDesc('date'),
                    Query.equal('afterImageUrl', ''),
                    Query.equal('userEmail', userEmail),
                    Query.limit(1),
                ]);

                if (latest.documents.length === 0) {
                    throw new Error('No matching before image found');
                }

                const docId = latest.documents[0].$id;

                await databases.updateDocument(DATABASE_ID, COLLECTION_ID, docId, {
                    afterImageUrl: afterFileId,
                    notes,
                    userEmail: userEmail,
                });

                await createNotification('AFTER photo updated.', docId);
            } else {
                const [beforeFileId, afterFileId] = await Promise.all([
                    uploadImageToStorage(beforeImage!),
                    uploadImageToStorage(afterImage!),
                ]);

                const docId = ID.unique();

                await databases.createDocument(DATABASE_ID, COLLECTION_ID, docId, {
                    beforeImageUrl: beforeFileId,
                    afterImageUrl: afterFileId,
                    notes,
                    date: new Date().toISOString(),
                    userEmail: userEmail,
                });

                await createNotification('BEFORE and AFTER photos submitted.', docId);
            }

            Alert.alert('Success', 'Photo saved.');
            setBeforeImage(null);
            setAfterImage(null);
            setNotes('');
            fetchPhotoSets();
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };


    const openPreview = (imageUrl: string) => {
        setPreviewImageUrl(imageUrl);
        setPreviewVisible(true);
    };

    const closePreview = () => {
        setPreviewVisible(false);
        setPreviewImageUrl(null);
    };

    const downloadImage = async (fileId: string) => {
        try {
            const fileUrl = buildImageUrl(fileId);
            if (Platform.OS === 'web') {
                window.open(fileUrl, '_blank');
            } else {
                Alert.alert('Download', 'Image download is only supported on web or with custom native code.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to download image.');
        }
    };

    const deleteImage = async (fileId: string) => {
        setIsLoading(true);
        try {
            await storage.deleteFile(BUCKET_ID, fileId);
            const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
                Query.or([
                    Query.equal('beforeImageUrl', fileId),
                    Query.equal('afterImageUrl', fileId),
                ]),
            ]);

            for (const doc of response.documents) {
                if (
                    (doc.beforeImageUrl === fileId && (!doc.afterImageUrl || doc.afterImageUrl === '')) ||
                    (doc.afterImageUrl === fileId && (!doc.beforeImageUrl || doc.beforeImageUrl === ''))
                ) {
                    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
                } else {
                    const update: any = {};
                    if (doc.beforeImageUrl === fileId) update.beforeImageUrl = '';
                    if (doc.afterImageUrl === fileId) update.afterImageUrl = '';
                    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, update);
                }
            }

            Alert.alert('Deleted', 'Image deleted successfully.');
            fetchPhotoSets();
        } catch (error) {
            Alert.alert('Error', 'Failed to delete image.');
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
                <Text style={styles.authText}>Please log in to access this feature</Text>
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Progress Tracker</Text>
                <Text style={styles.subtitle}>Compare before and after photos</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Capture Photos</Text>

                    <View style={styles.photoButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.photoButton, beforeImage && styles.photoButtonActive]}
                            onPress={() => takePhoto(setBeforeImage)}
                        >
                            <Ionicons
                                name="camera"
                                size={24}
                                color={beforeImage ? "#fff" : "#6B46C1"}
                            />
                            <Text style={[styles.photoButtonText, beforeImage && styles.photoButtonTextActive]}>
                                Before
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.photoButton, afterImage && styles.photoButtonActive]}
                            onPress={() => takePhoto(setAfterImage)}
                        >
                            <Ionicons
                                name="camera"
                                size={24}
                                color={afterImage ? "#fff" : "#6B46C1"}
                            />
                            <Text style={[styles.photoButtonText, afterImage && styles.photoButtonTextActive]}>
                                After
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {beforeImage || afterImage ? (
                        <View style={styles.previewContainer}>
                            <View style={styles.imagePreviewWrapper}>
                                {beforeImage && (
                                    <>
                                        <Text style={styles.previewLabel}>Before</Text>
                                        <Image
                                            source={{ uri: beforeImage.uri }}
                                            style={styles.imagePreview}
                                        />
                                        <TouchableOpacity
                                            style={styles.clearButton}
                                            onPress={() => setBeforeImage(null)}
                                        >
                                            <Ionicons name="close" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>

                            <View style={styles.imagePreviewWrapper}>
                                {afterImage && (
                                    <>
                                        <Text style={styles.previewLabel}>After</Text>
                                        <Image
                                            source={{ uri: afterImage.uri }}
                                            style={styles.imagePreview}
                                        />
                                        <TouchableOpacity
                                            style={styles.clearButton}
                                            onPress={() => setAfterImage(null)}
                                        >
                                            <Ionicons name="close" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.instructionText}>
                            Take at least one photo to get started
                        </Text>
                    )}
                </View>

                {/* Notes Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <TextInput
                        placeholder="Add any notes about your progress..."
                        placeholderTextColor="#999"
                        value={notes}
                        onChangeText={setNotes}
                        style={styles.notesInput}
                        multiline
                        editable={!isUploading}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (isUploading || (!beforeImage && !afterImage)) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isUploading || (!beforeImage && !afterImage)}
                >
                    {isUploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Save Progress</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Progress History</Text>

                    {photoSets.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="images" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyStateText}>No progress photos yet</Text>
                        </View>
                    ) : (
                        photoSets.map((item) => (
                            <View key={item.$id} style={styles.uploadCard}>
                                <View style={styles.uploadHeader}>
                                    <Text style={styles.uploadDate}>
                                        {new Date(item.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>

                                <View style={styles.comparisonContainer}>

                                    <View style={styles.comparisonItem}>
                                        <Text style={styles.comparisonLabel}>Before</Text>
                                        {item.beforeImageUrl ? (
                                            <>
                                                <TouchableOpacity
                                                    onPress={() => openPreview(buildImageUrl(item.beforeImageUrl))}
                                                >
                                                    <Image
                                                        source={{ uri: buildImageUrl(item.beforeImageUrl) }}
                                                        style={styles.comparisonImage}
                                                    />
                                                </TouchableOpacity>
                                                <View style={styles.actionButtons}>
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() => downloadImage(item.beforeImageUrl)}
                                                    >
                                                        <Ionicons name="download" size={16} color="#6B46C1" />
                                                        <Text style={styles.actionButtonText}>Download</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, styles.deleteButton]}
                                                        onPress={() =>
                                                            Alert.alert('Confirm Delete', 'Are you sure?', [
                                                                { text: 'Cancel', style: 'cancel' },
                                                                {
                                                                    text: 'Delete',
                                                                    style: 'destructive',
                                                                    onPress: () => deleteImage(item.beforeImageUrl)
                                                                },
                                                            ])
                                                        }
                                                    >
                                                        <Ionicons name="trash" size={16} color="#DC2626" />
                                                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </>
                                        ) : (
                                            <View style={styles.placeholderImage}>
                                                <Ionicons name="image" size={32} color="#D1D5DB" />
                                                <Text style={styles.placeholderText}>No before image</Text>
                                            </View>
                                        )}
                                    </View>


                                    <View style={styles.comparisonItem}>
                                        <Text style={styles.comparisonLabel}>After</Text>
                                        {item.afterImageUrl ? (
                                            <>
                                                <TouchableOpacity
                                                    onPress={() => openPreview(buildImageUrl(item.afterImageUrl))}
                                                >
                                                    <Image
                                                        source={{ uri: buildImageUrl(item.afterImageUrl) }}
                                                        style={styles.comparisonImage}
                                                    />
                                                </TouchableOpacity>
                                                <View style={styles.actionButtons}>
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() => downloadImage(item.afterImageUrl)}
                                                    >
                                                        <Ionicons name="download" size={16} color="#6B46C1" />
                                                        <Text style={styles.actionButtonText}>Download</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, styles.deleteButton]}
                                                        onPress={() =>
                                                            Alert.alert('Confirm Delete', 'Are you sure?', [
                                                                { text: 'Cancel', style: 'cancel' },
                                                                {
                                                                    text: 'Delete',
                                                                    style: 'destructive',
                                                                    onPress: () => deleteImage(item.afterImageUrl)
                                                                },
                                                            ])
                                                        }
                                                    >
                                                        <Ionicons name="trash" size={16} color="#DC2626" />
                                                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </>
                                        ) : (
                                            <View style={styles.placeholderImage}>
                                                <Ionicons name="image" size={32} color="#D1D5DB" />
                                                <Text style={styles.placeholderText}>No after image</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {item.notes && (
                                    <View style={styles.notesContainer}>
                                        <Text style={styles.notesLabel}>Notes:</Text>
                                        <Text style={styles.notesText}>{item.notes}</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>

                <Modal
                    visible={previewVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={closePreview}
                >
                    <Pressable style={styles.modalBackground} onPress={closePreview}>
                        {previewImageUrl && (
                            <Image
                                source={{ uri: previewImageUrl }}
                                style={styles.fullscreenImage}
                                resizeMode="contain"
                            />
                        )}
                        <TouchableOpacity
                            style={styles.closePreviewButton}
                            onPress={closePreview}
                        >
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                    </Pressable>
                </Modal>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: '#F9FAFB',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 24,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    photoButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    photoButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#6B46C1',
        backgroundColor: 'transparent',
        marginHorizontal: 4,
    },
    photoButtonActive: {
        backgroundColor: '#6B46C1',
        borderColor: '#6B46C1',
    },
    photoButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#6B46C1',
    },
    photoButtonTextActive: {
        color: '#fff',
    },
    instructionText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
    },
    previewContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    imagePreviewWrapper: {
        flex: 1,
        marginHorizontal: 4,
        position: 'relative',
    },
    previewLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 4,
    },
    imagePreview: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
    },
    clearButton: {
        position: 'absolute',
        top: 20,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notesInput: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#6B46C1',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#6B46C1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
        shadowColor: 'transparent',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    uploadCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    uploadHeader: {
        marginBottom: 12,
    },
    uploadDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    comparisonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    comparisonItem: {
        flex: 1,
        marginHorizontal: 4,
    },
    comparisonLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
        textAlign: 'center',
    },
    comparisonImage: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
    },
    placeholderImage: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    placeholderText: {
        marginTop: 8,
        fontSize: 12,
        color: '#9CA3AF',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#6B46C1',
        marginHorizontal: 4,
    },
    actionButtonText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
        color: '#6B46C1',
    },
    deleteButton: {
        borderColor: '#FECACA',
    },
    deleteButtonText: {
        color: '#DC2626',
    },
    notesContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    notesLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 4,
    },
    notesText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F9FAFB',
    },
    authText: {
        fontSize: 18,
        marginBottom: 20,
        color: '#1F2937',
    },
    loginButton: {
        backgroundColor: '#6B46C1',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: '100%',
        height: '80%',
    },
    closePreviewButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
    },
});

export default PhotoComparisonPage;