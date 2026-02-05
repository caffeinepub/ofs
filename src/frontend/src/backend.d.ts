import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface QRCodeSession {
    creator: Principal;
    expiryTime: Time;
    creationTime: Time;
    fileId: string;
    isValid: boolean;
}
export interface FileMetadata {
    id: string;
    blob: ExternalBlob;
    name: string;
    size: bigint;
    fileType: string;
    uploader: Principal;
    uploadTime: Time;
}
export interface AIProcessingResult {
    id: string;
    owner?: Principal;
    metadata: string;
    processedAt: Time;
    resultType: Variant_imageCompression_fileRecognition;
    processedFile?: ExternalBlob;
}
export interface TransferRecord {
    id: string;
    transferTime: Time;
    file: FileMetadata;
    sender: Principal;
    success: boolean;
    receiver: Principal;
    transferDuration: bigint;
}
export interface UserProfile {
    displayName: string;
    avatarUrl: string;
    online: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_imageCompression_fileRecognition {
    imageCompression = "imageCompression",
    fileRecognition = "fileRecognition"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    compressImage(id: string, image: ExternalBlob, quality: bigint): Promise<ExternalBlob>;
    createQRCodeSession(fileId: string, expiryDuration: bigint): Promise<string>;
    fetchFileMetadataByQRCode(qrId: string): Promise<FileMetadata | null>;
    getAIProcessingResult(id: string): Promise<AIProcessingResult>;
    getAllAIProcessingResults(): Promise<Array<AIProcessingResult>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFileMetadata(fileId: string): Promise<FileMetadata>;
    getOnlineUsers(): Promise<Array<Principal>>;
    getQRCodeSession(qrId: string): Promise<QRCodeSession>;
    getTransferHistory(user: Principal): Promise<Array<TransferRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    invalidateQRCodeSession(qrId: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    recordAIProcessing(id: string, resultType: Variant_imageCompression_fileRecognition, metadata: string, processedFile: ExternalBlob | null): Promise<void>;
    recordTransfer(id: string, sender: Principal, receiver: Principal, file: FileMetadata, duration: bigint, success: boolean): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setOnlineStatus(online: boolean): Promise<void>;
    updateProfile(displayName: string, avatarUrl: string): Promise<void>;
    uploadFile(id: string, name: string, size: bigint, fileType: string, blob: ExternalBlob): Promise<void>;
    validateQRCodeSession(qrId: string): Promise<boolean>;
}
