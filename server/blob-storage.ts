import { BlobServiceClient } from "@azure/storage-blob";

function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  if (!connectionString || !containerName) {
    throw new Error("Azure Blob Storage is niet geconfigureerd (AZURE_STORAGE_CONNECTION_STRING / AZURE_STORAGE_CONTAINER_NAME ontbreekt)");
  }
  const serviceClient = BlobServiceClient.fromConnectionString(connectionString);
  return serviceClient.getContainerClient(containerName);
}

export async function uploadSlide(
  blobName: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const container = getContainerClient();
  const blockBlob = container.getBlockBlobClient(blobName);
  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
}

export async function deleteSlide(blobName: string): Promise<void> {
  const container = getContainerClient();
  const blockBlob = container.getBlockBlobClient(blobName);
  await blockBlob.deleteIfExists();
}

export async function downloadSlide(blobName: string): Promise<{ stream: NodeJS.ReadableStream; contentType: string; size: number }> {
  const container = getContainerClient();
  const blockBlob = container.getBlockBlobClient(blobName);
  const props = await blockBlob.getProperties();
  const downloadResponse = await blockBlob.download(0);
  return {
    stream: downloadResponse.readableStreamBody!,
    contentType: props.contentType || "application/octet-stream",
    size: props.contentLength || 0,
  };
}
