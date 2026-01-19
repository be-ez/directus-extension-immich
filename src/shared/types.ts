export interface ImmichAsset {
  id: string;
  deviceAssetId: string;
  ownerId: string;
  deviceId: string;
  libraryId: string;
  type: 'IMAGE' | 'VIDEO';
  originalPath: string;
  originalFileName: string;
  originalMimeType: string;
  thumbhash: string | null;
  fileCreatedAt: string;
  fileModifiedAt: string;
  localDateTime: string;
  updatedAt: string;
  isFavorite: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  duration: string;
  exifInfo?: ImmichExifInfo;
}

export interface ImmichExifInfo {
  make: string | null;
  model: string | null;
  exifImageWidth: number | null;
  exifImageHeight: number | null;
  fileSizeInByte: number | null;
  orientation: string | null;
  dateTimeOriginal: string | null;
  modifyDate: string | null;
  timeZone: string | null;
  lensModel: string | null;
  fNumber: number | null;
  focalLength: number | null;
  iso: number | null;
  exposureTime: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
}

export interface ImmichAlbum {
  id: string;
  albumName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  albumThumbnailAssetId: string | null;
  shared: boolean;
  assetCount: number;
  assets?: ImmichAsset[];
}

export interface ImmichImageValue {
  id: string;
  originalFileName: string;
  type: 'IMAGE' | 'VIDEO';
  thumbhash?: string | null;
}

export type ThumbnailSize = 'thumbnail' | 'preview';

export interface ImmichStack {
  id: string;
  primaryAssetId: string;
  assets: ImmichAsset[];
}
