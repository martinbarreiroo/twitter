# AWS S3 Integration for Images

This Twitter-like application integrates with AWS S3 to store user profile pictures and post images using pre-signed URLs for secure, direct client-to-S3 uploads.

## Features

### User Profile Pictures

- **Upload URL Generation**: Generate pre-signed URLs for profile picture uploads
- **Profile Picture Update**: Update user profile after successful S3 upload
- **Supported Formats**: JPG, JPEG, PNG, GIF, WebP
- **Database Storage**: S3 keys are stored in the User model

## API Endpoints

### Profile Picture Endpoints

#### Generate Profile Picture Upload URL

```
POST /api/user/profile-picture/upload-url
```

**Request Body:**

```json
{
  "fileExtension": "jpg",
  "contentType": "image/jpeg"
}
```

**Response:**

```json
{
  "uploadUrl": "https://your-bucket.s3.amazonaws.com/profile-pictures/user-id/timestamp.jpg?...",
  "imageKey": "profile-pictures/user-id/timestamp.jpg"
}
```

#### Update Profile Picture

```
PUT /api/user/profile-picture
```

**Request Body:**

```json
{
  "profilePictureKey": "profile-pictures/user-id/timestamp.jpg"
}
```

## Setup Instructions

### 1. AWS S3 Bucket Setup

1. Create an S3 bucket in your AWS account
2. Configure the bucket for public read access (since images are not private)

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1

# S3 Bucket Configuration
AWS_S3_BUCKET_NAME=your-twitter-clone-bucket
```

### 3. IAM Policy

Create an IAM user with the following policy for S3 access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-twitter-clone-bucket/*"
    }
  ]
}
```

## Implementation Flow

### Profile Picture Upload Flow

1. **Client**: Request upload URL from `/api/user/profile-picture/upload-url`
2. **Server**: Generate pre-signed URL and return it with the S3 key
3. **Client**: Upload image directly to S3 using the pre-signed URL
4. **Client**: Confirm upload by calling `/api/user/profile-picture` with the S3 key
5. **Server**: Update user profile with the new profile picture key

## S3 Key Structure

### Profile Pictures

```
profile-pictures/{userId}/{timestamp}.{extension}
```

## Security Features

- **Pre-signed URLs**: Temporary, time-limited URLs for secure uploads
- **File Type Validation**: Server-side validation of allowed image formats
- **Direct Upload**: Images never pass through the backend server
- **Unique Keys**: Timestamp-based naming prevents conflicts
- **Permission Control**: IAM policies limit S3 access scope

## Error Handling

The S3 service includes comprehensive error handling for:

- Invalid file extensions
- Missing AWS credentials
- S3 upload failures
- Invalid S3 keys

## Dependencies

```json
{
  "@aws-sdk/client-s3": "^3.x.x",
  "@aws-sdk/s3-request-presigner": "^3.x.x"
}
```

## Database Schema Updates

### User Model

```prisma
model User {
  // ... existing fields
  profilePicture String? // S3 key for profile picture
  // ... rest of fields
}
```

---

# Testing S3 Profile Picture Flow with Postman

This section explains how to test the complete profile picture upload flow using AWS S3 pre-signed URLs.

## Prerequisites

1. **Environment Variables**: Make sure your `.env` file has the AWS credentials:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-twitter-clone-bucket
```

2. **S3 Bucket**: Ensure your S3 bucket exists and has the proper permissions for public access (since we're using it for profile pictures).

3. **Authentication**: You need a valid JWT token from the login endpoint.

## Step-by-Step Testing Process

### Step 1: Login to Get JWT Token

**Request:**

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Copy the token for use in subsequent requests.

### Step 2: Generate Pre-signed Upload URL

**Request:**

```
POST http://localhost:8080/api/user/profile-picture/upload-url
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "fileExtension": "jpg",
  "contentType": "image/jpeg"
}
```

**Supported file types:**

- `fileExtension`: "jpg", "jpeg", "png", "gif", "webp"
- `contentType`: "image/jpeg", "image/png", "image/gif", "image/webp"

**Response:**

```json
{
  "uploadUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/profile-pictures/user-id/timestamp.jpg?AWSAccessKeyId=...",
  "imageKey": "profile-pictures/user-id/timestamp.jpg"
}
```

### Step 3: Upload Image to S3 Using Pre-signed URL

**⚠️ Important**: This is a direct upload to AWS S3, not to your application server.

**Request:**

```
PUT [uploadUrl from step 2]
Content-Type: [same contentType from step 2]
Body: [Raw binary image file]
```

**In Postman:**

1. Create a new PUT request
2. Paste the `uploadUrl` from step 2 as the URL
3. Set Headers:
   - `Content-Type`: Use the same contentType from step 2 (e.g., "image/jpeg")
4. In Body tab:
   - Select "binary"
   - Click "Select File" and choose your image file

**Response:**

- Status: 200 OK
- Empty body (this is normal for S3 uploads)

### Step 4: Update User Profile Picture

After successful S3 upload, update the user's profile in the database:

**Request:**

```
PUT http://localhost:8080/api/user/profile-picture
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "profilePictureKey": "profile-pictures/user-id/timestamp.jpg"
}
```

Use the `imageKey` from step 2 response.

**Response:**

```json
{
  "message": "Profile picture updated successfully"
}
```

### Step 5: Verify Profile Picture Update

Check that the profile picture was updated:

**Request:**

```
GET http://localhost:8080/api/user/me
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "id": "user-id",
  "name": "User Name",
  "profilePicture": "profile-pictures/user-id/timestamp.jpg",
  "likesCount": 0,
  "retweetsCount": 0,
  "commentsCount": 0,
  "createdAt": "2025-05-27T...",
  "isPrivate": false
}
```

## Postman Collection Setup

### 1. Environment Variables

Create a Postman environment with:

- `base_url`: `http://localhost:8080`
- `jwt_token`: (will be set after login)

### 2. Pre-request Scripts

For authenticated requests, add this pre-request script:

```javascript
// Auto-set authorization header
pm.request.headers.add({
  key: "Authorization",
  value: "Bearer " + pm.environment.get("jwt_token"),
});
```

### 3. Tests for Login Request

Add this test to the login request to auto-save the token:

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("jwt_token", response.token);
}
```
