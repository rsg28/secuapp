import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

interface UploadImageParams {
  imageUri: string;
  folder: 'inspection-images' | 'profile-images' | 'company-images';
  subfolder?: 'closed' | 'open'; // Solo para inspection-images
  identifier: string; // response_id para inspection, user_id para profile, company_id para company-images
  itemId?: string; // item_id para inspection-images (opcional)
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (params: UploadImageParams): Promise<string | null> => {
    try {
      setUploading(true);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // Detectar el tipo MIME basado en la URI
      const getMimeType = (uri: string): string => {
        const extension = uri.split('.').pop()?.toLowerCase();
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            return 'image/jpeg';
          case 'png':
            return 'image/png';
          case 'gif':
            return 'image/gif';
          default:
            return 'image/jpeg'; // Default
        }
      };

      const mimeType = getMimeType(params.imageUri);
      const fileName = `photo.${mimeType.split('/')[1]}`;

      // Convertir URI a FormData (formato React Native)
      const formData = new FormData();
      formData.append('image', {
        uri: params.imageUri,
        type: mimeType,
        name: fileName,
      } as any);
      formData.append('folder', params.folder);
      
      if (params.subfolder) {
        formData.append('subfolder', params.subfolder);
      }
      
      formData.append('identifier', params.identifier);
      
      if (params.folder === 'inspection-images' && params.itemId) {
        formData.append('itemId', params.itemId);
      }

      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No establecer Content-Type - React Native lo establece automáticamente con el boundary correcto
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir la imagen');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error: any) {
      console.error('[useImageUpload] Error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      setUploading(true);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // Extraer la key de S3 de la URL
      const extractS3KeyFromUrl = (url: string): string | null => {
        try {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          // Remover el primer slash si existe
          return pathname.startsWith('/') ? pathname.substring(1) : pathname;
        } catch (error) {
          console.error('[useImageUpload] Error extracting S3 key from URL:', error);
          return null;
        }
      };

      const s3Key = extractS3KeyFromUrl(imageUrl);
      if (!s3Key) {
        throw new Error('No se pudo extraer la key de S3 de la URL');
      }

      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ key: s3Key }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la imagen');
      }

      return true;
    } catch (error: any) {
      console.error('[useImageUpload] Error deleting image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, deleteImage, uploading };
};

