import { S3Client } from "@aws-sdk/client-s3";
import AWSXRay from "aws-xray-sdk";

const s3Client = AWSXRay.captureAWSv3Client(
  new S3Client({
    region: process.env.AWS_REGION,
  })
);

export default s3Client;