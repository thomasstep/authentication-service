package adapters

import (
	"bytes"
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func WriteFile(contents []byte, destinationPath string) {
	contentsReader := bytes.NewReader(contents)
	s3Client := GetS3Client()
	_, err := s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(config.PrimaryBucketName),
		Key:    aws.String(destinationPath),
		Body:   contentsReader,
	})
	if err != nil {
		panic(err)
	}
}

func ReadFile(path string) []byte {
	s3Client := GetS3Client()
	output, err := s3Client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(config.PrimaryBucketName),
		Key:    aws.String(path),
	})
	if err != nil {
		panic(err)
	}
	buf := new(bytes.Buffer)
	buf.ReadFrom(output.Body)
	return buf.Bytes()
}

func DeleteFile(path string) {
	s3Client := GetS3Client()
	_, err := s3Client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(config.PrimaryBucketName),
		Key:    aws.String(path),
	})
	if err != nil {
		panic(err)
	}
}
