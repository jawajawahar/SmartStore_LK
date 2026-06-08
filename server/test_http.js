const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '.env') });
const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne();
    if (!user) throw new Error("No active user found to test with");

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '1h' });

    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let body = '';
    
    const fields = {
      name: 'Jawaher UI Test',
      category: 'Grocery',
      buyingPrice: '250',
      sellingPrice: '300',
      bulkPrice: '275',
      stock: '50',
      barcode: '13221',
      productType: 'fixed',
      unit: 'pcs'
    };

    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
    
    // Add dummy image
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="image"; filename="test_image.jpg"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;
    body += `dummy image content\r\n`;
    body += `--${boundary}--\r\n`;

    const response = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`
      },
      body: body
    });

    const data = await response.text();
    console.log('STATUS:', response.status);
    console.log('RESPONSE:', data);

  } catch (error) {
    console.log('FAILED:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

run();
