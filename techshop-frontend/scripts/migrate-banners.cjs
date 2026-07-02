const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GATEWAY_URL = 'http://localhost:8080';
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';

// Load environment variables from .env
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  console.log(`📡 Đang nạp cấu hình môi trường từ: ${envPath}`);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val.trim();
      }
    }
  }
}

loadEnv();

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Lỗi: Thiếu cấu hình Cloudinary trong .env!');
  process.exit(1);
}

function signCloudinaryRequest(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + apiSecret;
  return crypto.createHash('sha1').update(signatureString).digest('hex');
}

async function uploadToCloudinary(localPath, folderName) {
  try {
    const absPath = path.resolve(__dirname, '../public', localPath);
    if (!fs.existsSync(absPath)) {
      console.warn(`      ⚠️ Không tìm thấy ảnh cục bộ tại: ${absPath}`);
      return '';
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `techshop/${folderName}`;
    const params = { folder, timestamp };
    const signature = signCloudinaryRequest(params, CLOUDINARY_API_SECRET);

    const fileBuffer = fs.readFileSync(absPath);
    const blob = new Blob([fileBuffer]);

    const formData = new FormData();
    formData.append('file', blob, path.basename(absPath));
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', folder);
    formData.append('signature', signature);

    const response = await fetch(`${CLOUDINARY_UPLOAD_URL}/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} - ${errText}`);
    }

    const resData = await response.json();
    return resData.secure_url;
  } catch (error) {
    console.error(`   ❌ Lỗi khi tải ảnh ${localPath} lên Cloudinary:`, error.message);
    return '';
  }
}

const BANNERS_TO_MIGRATE = [
  // Slides
  {
    localPath: 'gearvn-thu-cu-doi-moi-t10-slider.jpeg',
    title: 'Thu Cũ Đổi Mới',
    linkUrl: '/trade-in-pricing',
    position: 'HERO_SLIDE',
    displayOrder: 1
  },
  {
    localPath: 'gearvn-pc-gvn-t11-slider.jpg',
    title: 'PC GVN T11',
    linkUrl: '/products?category=pc-gvn',
    position: 'HERO_SLIDE',
    displayOrder: 2
  },
  {
    localPath: 'gearvn-man-hinh-t10-slider.jpg',
    title: 'Màn hình T10',
    linkUrl: '/products?category=man-hinh',
    position: 'HERO_SLIDE',
    displayOrder: 3
  },
  {
    localPath: 'gearvn-laptop-acer-predator-triton-14a-slider-t12.jpg',
    title: 'Acer Predator Triton 14',
    linkUrl: '/products?category=laptop-gaming',
    position: 'HERO_SLIDE',
    displayOrder: 4
  },
  {
    localPath: 'gearvn-laptop-nvidia-rtx-50-series-slider.jpg',
    title: 'Laptop RTX 50 Series',
    linkUrl: '/products?category=laptop-gaming',
    position: 'HERO_SLIDE',
    displayOrder: 5
  },
  {
    localPath: 'gearvn-laptop-gigabyte-slider-t12.jpg',
    title: 'Laptop Gigabyte Slider',
    linkUrl: '/products?category=laptop-gaming',
    position: 'HERO_SLIDE',
    displayOrder: 6
  },
  {
    localPath: 'gearvn-pc-gvn-nvidia-sliders.jpg',
    title: 'PC GVN Nvidia Slider',
    linkUrl: '/products?category=pc-gvn',
    position: 'HERO_SLIDE',
    displayOrder: 7
  },
  // Hero Right Banners
  {
    localPath: 'gearvn-build-pc-sub-banner-t1-26.png',
    title: 'Build PC Banner',
    linkUrl: '/products?category=pc-gvn',
    position: 'HERO_RIGHT',
    displayOrder: 1
  },
  {
    localPath: 'gearvn-ban-phim-sub-banner-t1-26.png',
    title: 'Bàn Phím Banner',
    linkUrl: '/products?category=ban-phim',
    position: 'HERO_RIGHT',
    displayOrder: 2
  }
];

async function startMigration() {
  console.log('🚀 === BẮT ĐẦU DI CHUYỂN BANNERS SANG DATABASE ===');

  // Bước 1: Đăng nhập Admin lấy token
  console.log('🔑 Đang đăng nhập hệ thống admin...');
  let token = '';
  try {
    const loginRes = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@techshop.com', password: 'Admin@123' })
    });
    if (!loginRes.ok) {
      throw new Error(`Đăng nhập thất bại: ${loginRes.status}`);
    }
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log('✅ Đăng nhập thành công.');
  } catch (err) {
    console.error('❌ Thất bại khi đăng nhập hệ thống admin:', err.message);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Bước 2: Upload và lưu Banners
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < BANNERS_TO_MIGRATE.length; i++) {
    const banner = BANNERS_TO_MIGRATE[i];
    console.log(`\n🔄 [${i + 1}/${BANNERS_TO_MIGRATE.length}] Xử lý banner: "${banner.title}"`);

    const cloudinaryUrl = await uploadToCloudinary(banner.localPath, 'banners');
    if (!cloudinaryUrl) {
      console.error(`   ❌ Upload ảnh thất bại, bỏ qua banner này.`);
      failCount++;
      continue;
    }

    console.log(`   ✅ Tải ảnh lên Cloudinary thành công: ${cloudinaryUrl}`);

    const bannerPayload = {
      title: banner.title,
      imageUrl: cloudinaryUrl,
      linkUrl: banner.linkUrl,
      position: banner.position,
      displayOrder: banner.displayOrder,
      active: true
    };

    try {
      const createRes = await fetch(`${GATEWAY_URL}/api/banners`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(bannerPayload)
      });

      if (!createRes.ok) {
        const errTxt = await createRes.text();
        throw new Error(`Lỗi chèn Database: ${createRes.status} - ${errTxt}`);
      }

      const createdBanner = await createRes.json();
      console.log(`   ✅ Đã chèn Banner vào MySQL. ID: ${createdBanner.id}`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Thất bại khi lưu vào database:`, err.message);
      failCount++;
    }
  }

  console.log('\n📊 === BÁO CÁO KẾT QUẢ DI CHUYỂN BANNERS ===');
  console.log(`   - Tổng số banners: ${BANNERS_TO_MIGRATE.length}`);
  console.log(`   - Thành công: ${successCount}`);
  console.log(`   - Thất bại: ${failCount}`);
  console.log('============================================\n');
}

startMigration().catch(console.error);
