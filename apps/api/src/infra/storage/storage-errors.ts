export type MappedStorageError = {
  httpStatus: number;
  code: string;
  message: string;
};

export function mapS3Error(err: unknown, operation: string): MappedStorageError {
  const e = err as {
    name?: string;
    Code?: string;
    message?: string;
    $metadata?: { httpStatusCode?: number };
  };
  const name = e.name || e.Code || "StorageError";
  const detail = e.message?.trim() || "Object storage operation failed";

  switch (name) {
    case "NoSuchBucket":
      return {
        httpStatus: 503,
        code: "STORAGE_BUCKET_NOT_FOUND",
        message: `S3 bucket not found during ${operation}. Verify S3_BUCKET exists and credentials can access it.`
      };
    case "AccessDenied":
      return {
        httpStatus: 503,
        code: "STORAGE_ACCESS_DENIED",
        message: `S3 access denied during ${operation}. Verify S3_ACCESS_KEY, S3_SECRET_KEY, and bucket policy.`
      };
    case "InvalidAccessKeyId":
    case "SignatureDoesNotMatch":
      return {
        httpStatus: 503,
        code: "STORAGE_AUTH_ERROR",
        message: `S3 authentication failed during ${operation}. Check S3_ACCESS_KEY and S3_SECRET_KEY.`
      };
    case "NetworkingError":
    case "TimeoutError":
      return {
        httpStatus: 503,
        code: "STORAGE_NETWORK_ERROR",
        message: `Cannot reach S3 endpoint during ${operation}. Check S3_ENDPOINT, S3_REGION, and network connectivity.`
      };
    case "NotFound":
      return {
        httpStatus: 503,
        code: "STORAGE_ENDPOINT_ERROR",
        message: `S3 endpoint returned not found during ${operation}. Check S3_ENDPOINT and S3_FORCE_PATH_STYLE.`
      };
    case "InvalidBucketName":
      return {
        httpStatus: 503,
        code: "STORAGE_INVALID_BUCKET",
        message: `Invalid S3 bucket name. Check S3_BUCKET.`
      };
    default:
      return {
        httpStatus: 503,
        code: "STORAGE_OPERATION_FAILED",
        message: `S3 ${operation} failed (${name}): ${detail}`
      };
  }
}
