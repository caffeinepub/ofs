import Map "mo:core/Map";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";


import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    displayName : Text;
    avatarUrl : Text;
    online : Bool;
  };

  public type FileMetadata = {
    id : Text;
    name : Text;
    size : Nat;
    fileType : Text;
    uploader : Principal;
    uploadTime : Time.Time;
    blob : Storage.ExternalBlob;
  };

  public type TransferRecord = {
    id : Text;
    sender : Principal;
    receiver : Principal;
    file : FileMetadata;
    transferTime : Time.Time;
    transferDuration : Nat;
    success : Bool;
  };

  public type AIProcessingResult = {
    id : Text;
    owner : ?Principal;
    processedAt : Time.Time;
    resultType : { #imageCompression; #fileRecognition };
    metadata : Text;
    processedFile : ?Storage.ExternalBlob;
  };

  public type QRCodeSession = {
    fileId : Text;
    creator : Principal;
    isValid : Bool;
    creationTime : Time.Time;
    expiryTime : Time.Time;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let fileMetadata = Map.empty<Text, FileMetadata>();
  let transferRecords = Map.empty<Text, TransferRecord>();
  let aiProcessingResults = Map.empty<Text, AIProcessingResult>();
  let qrCodeSessions = Map.empty<Text, QRCodeSession>();

  module TransferRecord {
    public func compareByTime(a : TransferRecord, b : TransferRecord) : Order.Order {
      Int.compare(a.transferTime, b.transferTime);
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func updateProfile(displayName : Text, avatarUrl : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    let profile : UserProfile = {
      displayName;
      avatarUrl;
      online = true;
    };

    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func uploadFile(id : Text, name : Text, size : Nat, fileType : Text, blob : Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can upload files");
    };

    let metadata : FileMetadata = {
      id;
      name;
      size;
      fileType;
      uploader = caller;
      uploadTime = Time.now();
      blob;
    };

    fileMetadata.add(id, metadata);
  };

  public query ({ caller }) func getFileMetadata(fileId : Text) : async FileMetadata {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access file metadata");
    };

    switch (fileMetadata.get(fileId)) {
      case (?metadata) {
        // Verify caller is the uploader or an admin
        if (caller != metadata.uploader and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own files");
        };
        metadata;
      };
      case (null) { Runtime.trap("File not found") };
    };
  };

  public shared ({ caller }) func recordTransfer(
    id : Text,
    sender : Principal,
    receiver : Principal,
    file : FileMetadata,
    duration : Nat,
    success : Bool,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can record transfers");
    };

    // Only the sender can record the transfer to prevent fake records
    if (caller != sender) {
      Runtime.trap("Unauthorized: Only the sender can record a transfer");
    };

    // Verify the file belongs to the sender
    switch (fileMetadata.get(file.id)) {
      case (?metadata) {
        if (metadata.uploader != sender) {
          Runtime.trap("Unauthorized: Can only transfer your own files");
        };
      };
      case (null) {
        // File metadata not found, but allow recording for peer-to-peer transfers
      };
    };

    let record : TransferRecord = {
      id;
      sender;
      receiver;
      file;
      transferTime = Time.now();
      transferDuration = duration;
      success;
    };

    transferRecords.add(id, record);
  };

  public query ({ caller }) func getTransferHistory(user : Principal) : async [TransferRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view transfer history");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own transfer history");
    };

    let userRecords = List.empty<TransferRecord>();

    for ((_, record) in transferRecords.entries()) {
      if (record.sender == user or record.receiver == user) {
        userRecords.add(record);
      };
    };

    userRecords.toArray().sort(TransferRecord.compareByTime);
  };

  public shared ({ caller }) func setOnlineStatus(online : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update status");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile : UserProfile = {
          displayName = profile.displayName;
          avatarUrl = profile.avatarUrl;
          online;
        };
        userProfiles.add(caller, updatedProfile);
      };
      case (null) {
        let newProfile : UserProfile = {
          displayName = "Anonymous";
          avatarUrl = "";
          online;
        };
        userProfiles.add(caller, newProfile);
      };
    };
  };

  public query ({ caller }) func getOnlineUsers() : async [Principal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view online users");
    };

    let onlineUsers = List.empty<Principal>();
    for ((user, profile) in userProfiles.entries()) {
      if (profile.online) {
        onlineUsers.add(user);
      };
    };
    onlineUsers.toArray();
  };

  public shared ({ caller }) func compressImage(id : Text, image : Storage.ExternalBlob, quality : Nat) : async Storage.ExternalBlob {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can compress images");
    };

    // Verify the image belongs to the caller if it exists in metadata
    switch (fileMetadata.get(id)) {
      case (?metadata) {
        if (metadata.uploader != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only compress your own images");
        };
      };
      case (null) {
        // Allow compression of new images not yet in metadata
      };
    };

    let result : AIProcessingResult = {
      id;
      owner = ?caller;
      processedAt = Time.now();
      resultType = #imageCompression;
      metadata = "Compressed image with quality " # quality.toText();
      processedFile = ?image;
    };

    aiProcessingResults.add(id, result);

    image;
  };

  public shared ({ caller }) func recordAIProcessing(
    id : Text,
    resultType : { #imageCompression; #fileRecognition },
    metadata : Text,
    processedFile : ?Storage.ExternalBlob,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can record AI processing results");
    };

    let result : AIProcessingResult = {
      id;
      owner = ?caller;
      processedAt = Time.now();
      resultType;
      metadata;
      processedFile;
    };

    aiProcessingResults.add(id, result);
  };

  public query ({ caller }) func getAIProcessingResult(id : Text) : async AIProcessingResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access AI processing results");
    };

    switch (aiProcessingResults.get(id)) {
      case (?result) {
        // Verify caller owns the result or is an admin
        let isOwner = switch (result.owner) {
          case (?owner) { owner == caller };
          case (null) { false };
        };

        if (not isOwner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own AI processing results");
        };
        result;
      };
      case (null) { Runtime.trap("AI processing result not found") };
    };
  };

  public query ({ caller }) func getAllAIProcessingResults() : async [AIProcessingResult] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access AI processing results");
    };

    let userResults = List.empty<AIProcessingResult>();
    for ((_, result) in aiProcessingResults.entries()) {
      let isOwner = switch (result.owner) {
        case (?owner) { owner == caller };
        case (null) { false };
      };

      if (isOwner or AccessControl.isAdmin(accessControlState, caller)) {
        userResults.add(result);
      };
    };
    userResults.toArray();
  };

  // QR Code Functionality

  public shared ({ caller }) func createQRCodeSession(fileId : Text, expiryDuration : Nat) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create QR codes");
    };

    // Verify file exists and belongs to the caller
    switch (fileMetadata.get(fileId)) {
      case (?metadata) {
        if (metadata.uploader != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only create QR codes for your own files");
        };
      };
      case (null) { Runtime.trap("File not found") };
    };

    let sessionId = fileId # "-" # Time.now().toText();
    let expiryTime = Time.now() + expiryDuration;

    let session : QRCodeSession = {
      fileId;
      creator = caller;
      isValid = true;
      creationTime = Time.now();
      expiryTime;
    };

    qrCodeSessions.add(sessionId, session);

    sessionId;
  };

  public shared ({ caller }) func validateQRCodeSession(qrId : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can validate QR codes");
    };

    switch (qrCodeSessions.get(qrId)) {
      case (?session) {
        if (not session.isValid) {
          return false;
        };

        if (Time.now() > session.expiryTime) {
          return false;
        };

        switch (fileMetadata.get(session.fileId)) {
          case (?_) { true };
          case (null) { false };
        };
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func invalidateQRCodeSession(qrId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can invalidate QR codes");
    };

    switch (qrCodeSessions.get(qrId)) {
      case (?session) {
        // Only the creator or an admin can invalidate the session
        if (session.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the QR code creator can invalidate it");
        };

        let updatedSession : QRCodeSession = {
          fileId = session.fileId;
          creator = session.creator;
          isValid = false;
          creationTime = session.creationTime;
          expiryTime = session.expiryTime;
        };
        qrCodeSessions.add(qrId, updatedSession);
      };
      case (null) { Runtime.trap("QR code not found") };
    };
  };

  public query ({ caller }) func getQRCodeSession(qrId : Text) : async QRCodeSession {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access QR code sessions");
    };

    switch (qrCodeSessions.get(qrId)) {
      case (?session) {
        // Only the creator or an admin can view the full session details
        if (session.creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the QR code creator can view session details");
        };
        session;
      };
      case (null) { Runtime.trap("QR code not found") };
    };
  };

  public shared ({ caller }) func fetchFileMetadataByQRCode(qrId : Text) : async ?FileMetadata {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch file metadata by QR code");
    };

    switch (qrCodeSessions.get(qrId)) {
      case (?session) {
        // Verify the QR code session is valid and not expired
        if (not session.isValid) {
          Runtime.trap("Unauthorized: QR code session is invalid");
        };

        if (Time.now() > session.expiryTime) {
          Runtime.trap("Unauthorized: QR code session has expired");
        };

        // Return the file metadata if all checks pass
        fileMetadata.get(session.fileId);
      };
      case (null) { 
        Runtime.trap("Unauthorized: QR code not found");
      };
    };
  };
};
