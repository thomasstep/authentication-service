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
  const response = await client.send(command);
  logger.debug(response);
}

async function readFile(path) {
  const input = {
    Bucket: PRIMARY_BUCKET_NAME,
    Key: path,
  };
  const command = new GetObjectCommand(input);
  const response = await client.send(command);
  logger.debug(response);
  return response;
}

async function removeFile(path) {
  const input = {
    Bucket: PRIMARY_BUCKET_NAME,
    Key: path,
  };
  const command = new DeleteObjectCommand(input);
  const response = await client.send(command);
  logger.debug(response);
  return response;
}

module.exports = {
  saveFile,
  readFile,
  removeFile,
};
