const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const {
  DEFAULT_S3_REGION,
  PRIMARY_BUCKET_NAME,
} = require('/opt/config');
const { logger } = require('/opt/logger');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || DEFAULT_S3_REGION,
});

async function saveFile(fileContents, path, contentType = 'text/plain') {
  const input = {
    Bucket: PRIMARY_BUCKET_NAME,
    Key: path,
    ContentType: contentType,
    Body: fileContents,
  };
  const command = new PutObjectCommand(input);
  const response = await s3Client.send(command);
  logger.debug(response);
}

// Create a helper function to convert a ReadableStream to a string.
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => {
      chunks.push(chunk);
    });
    stream.on("error", reject);
    stream.on("end", () => {
      resolve(chunks.join(''))
    });
  });
}

async function readFile(path) {
  const input = {
    Bucket: PRIMARY_BUCKET_NAME,
    Key: path,
  };
  const command = new GetObjectCommand(input);
  const response = await s3Client.send(command);
  const fileContents = await streamToString(response.Body);
  logger.debug(fileContents);
  return fileContents;
}

async function removeFile(path) {
  const input = {
    Bucket: PRIMARY_BUCKET_NAME,
    Key: path,
  };
  const command = new DeleteObjectCommand(input);
  const response = await s3Client.send(command);
  logger.debug(response);
  return response;
}

module.exports = {
  saveFile,
  readFile,
  removeFile,
};
