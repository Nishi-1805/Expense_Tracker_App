const AWS =  require('aws-sdk');

const uploadToS3 = (data, filename) => {
    const BUCKET_NAME = process.env.BUCKET_NAME;
    const IAM_USERs_KEY = process.env.IAM_USER_KEY;
    const IAM_USERs_SECRET = process.env.IAM_USER_SECRET;
  
    let s3bucket = new AWS.S3({
      accessKeyId : IAM_USERs_KEY,
      secretAccessKey: IAM_USERs_SECRET,
     // Bucket: BUCKET_NAME
    })
    const fileContent = data.map((expense) => {
        return `${expense.income}\t${expense.expense}\t${expense.description}\t${expense.balance}\n`;
      }).join('');

    var params = {
      Bucket : BUCKET_NAME,
      Key: filename,
      Body: Buffer.from(fileContent, 'utf8'), 
      ACL: 'public-read'
    }
  return new Promise((resolve, reject) => {
    s3bucket.upload(params, (err, s3response) =>{
      if(err){
        console.log('Something went wrong', err)
        reject(err);
      }else{
        console.log('success', s3response)
        resolve(s3response.Location);
      }
    })
  })
  }
  
  module.exports = {uploadToS3};
