import express from "express";
import sharp from "sharp";
import { S3 } from "aws-sdk";
import { Req } from "../../types/networkingTypes";
import { User } from "../../entities/User";

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const handleChangeProfilePic = async (req: Req, res: express.Response) => {
  const file = req.file;

  if (!file) {
    res.status(400);
    return res.json({
      error: "invalid arguments",
    });
  }

  const resizedPic = await sharp(file.buffer)
    .resize({
      fit: sharp.fit.contain,
      width: 200,
    })
    .rotate()
    .webp({ quality: 70 })
    .toBuffer();

  const getUploadedImages = await s3
    .listObjects({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: `${req.session.userId}`,
    })
    .promise();

  if (getUploadedImages.Contents) {
    for (let image of getUploadedImages.Contents!) {
      await s3
        .deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: image.Key as string,
        })
        .promise();
    }
  }

  const newProfilePic = await s3
    .upload({
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: resizedPic as Buffer,
      Key: `${req.session.userId}/profilePic/${file.originalname}`,
      ContentType: file.mimetype,
      BucketKeyEnabled: true,
      ACL: "public-read",
    })
    .promise();

  await User.update(req.session.userId!, {
    profilePicUrl: newProfilePic.Location,
  });

  return res.json({ profilePicUrl: newProfilePic.Location });
};

export default handleChangeProfilePic;
