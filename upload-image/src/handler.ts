import { S3 } from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { parse } from 'lambda-multipart-parser'
import { v4 as uuidv4 } from 'uuid'

const s3 = new S3({ region: 'ap-southeast-2' })
const bucketName = process.env.BUCKET_NAME

async function uploadImage(
  fileContent: Buffer,
  contentType: string
): Promise<{ Location: string; Key: string }> {
  try {
    const uniqueKey = uuidv4()
    const params = {
      Bucket: bucketName,
      Key: `${uniqueKey}`,
      Body: fileContent,
      ContentType: contentType,
    }

    const { Location, Key } = await s3.upload(params).promise()
    return { Location, Key }
  } catch (error) {
    console.log(error)
    throw new Error('Failed to upload file to S3')
  }
}

export async function uploadHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const parsed = await parse(event)

    console.log(parsed)

    if (!parsed.files || parsed.files.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: 'Missing required parameters',
      }
    }

    const file = parsed.files[0]

    const { Location: fileUrl, Key: fileKey } = await uploadImage(
      file.content,
      file.contentType
    )

    const imageId = fileKey.split('/')[0]
    const fileName = file.filename
    const fileExtension = fileName.split('.').pop()
    const fileSize = file.content.byteLength
    const uploadDate = new Date().toISOString()

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Uploaded successfully',
        metaData: {
          imageId: imageId,
          imageUrl: fileUrl,
          fileName: fileName,
          fileExtension: fileExtension,
          fileSize: fileSize,
          uploadDate: uploadDate,
        },
      }),
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: 'Something went wrong. Please try again.',
    }
  }
}
