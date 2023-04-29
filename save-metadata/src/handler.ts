import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();

async function storeImageMetadata(
  imageId: string,
  imageUrl: string,
  fileName: string,
  fileExtension: string,
  fileSize: number,
  uploadDate: string
) {
  const params = {
    TableName: "ImageMetadata",
    Item: {
      ImageID: imageId,
      ImageUrl: imageUrl,
      FileName: fileName,
      FileExtension: fileExtension,
      FileSize: fileSize,
      UploadDate: uploadDate,
    },
  };

  return dynamoDb.put(params).promise();
}

export async function saveHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: "Missing event body",
      };
    }

    const { imageId, imageUrl, fileName, fileExtension, fileSize, uploadDate } =
      JSON.parse(event.body);

    if (
      !imageId ||
      !imageUrl ||
      !fileName ||
      !fileExtension ||
      !fileSize ||
      !uploadDate
    ) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: "Missing required parameters",
      };
    }

    await storeImageMetadata(
      imageId,
      imageUrl,
      fileName,
      fileExtension,
      fileSize,
      uploadDate
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Image metadata stored successfully",
        ImageID: imageId,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: `Something went wrong. Error: ${error.message}`,
    };
  }
}
