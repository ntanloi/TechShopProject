const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cấu hình Base URL của API Gateway
const GATEWAY_URL = 'http://localhost:8080';
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1';

// Tải thông số môi trường từ file .env gốc
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
  console.error('❌ Lỗi: Thiếu thông tin cấu hình Cloudinary trong file .env!');
  process.exit(1);
}

console.log('✅ Đã nạp cấu hình Cloudinary:');
console.log(`   - Cloud Name: ${CLOUDINARY_CLOUD_NAME}`);
console.log(`   - API Key: ${CLOUDINARY_API_KEY}`);

// Hàm ký yêu cầu upload Cloudinary sử dụng SHA-1
function signCloudinaryRequest(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + apiSecret;
  return crypto.createHash('sha1').update(signatureString).digest('hex');
}

// Hàm tải ảnh lên Cloudinary dùng fetch & FormData (không thư viện ngoài)
async function uploadToCloudinary(localPath, folderName) {
  try {
    const cleanPath = localPath.replace(/^\//, '').replace(/\//g, path.sep);
    // Tìm ảnh trong thư mục public của gearvn-clone
    const absPath = path.resolve(__dirname, '../../gearvn-clone-master/public', cleanPath);

    if (!fs.existsSync(absPath)) {
      console.warn(`      ⚠️ Không tìm thấy ảnh cục bộ tại: ${absPath}, sử dụng link ảnh trống.`);
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

// Phân tích dữ liệu Firestore REST
function parseFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('arrayValue' in val) {
    const arr = val.arrayValue.values || [];
    return arr.map(item => parseFirestoreValue(item));
  }
  if ('mapValue' in val) {
    const fields = val.mapValue.fields || {};
    const res = {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = parseFirestoreValue(v);
    }
    return res;
  }
  return null;
}

// Bảng ánh xạ menu danh mục của GearVN
const CATEGORIES_TO_CREATE = [
  { slug: 'laptop', name: 'Laptop', description: 'Máy tính xách tay văn phòng, học sinh sinh viên' },
  { slug: 'laptop-gaming', name: 'Laptop Gaming', description: 'Máy tính xách tay chơi game hiệu năng cao' },
  { slug: 'pc-gvn', name: 'PC GVN', description: 'Máy tính để bàn GearVN lắp ráp' },
  { slug: 'main-cpu-vga', name: 'Main, CPU, VGA', description: 'Linh kiện lõi: Bo mạch chủ, Bộ vi xử lý, Card màn hình' },
  { slug: 'case-nguon-tan', name: 'Case, Nguồn, Tản', description: 'Vỏ máy, bộ nguồn, hệ thống tản nhiệt khí/nước' },
  { slug: 'o-cung-ram-the-nho', name: 'Ổ cứng, RAM, Thẻ nhớ', description: 'SSD, HDD, RAM PC/Laptop, USB và thẻ nhớ' },
  { slug: 'loa-micro-webcam', name: 'Loa, Micro, Webcam', description: 'Thiết bị âm thanh nghe nhạc, đàm thoại và ghi hình' },
  { slug: 'man-hinh', name: 'Màn hình', description: 'Màn hình hiển thị chính hãng' },
  { slug: 'ban-phim', name: 'Bàn phím', description: 'Bàn phím cơ, bàn phím chơi game và văn phòng' },
  { slug: 'chuot-lot-chuot', name: 'Chuột + Lót chuột', description: 'Chuột quang chơi game, chuột văn phòng và bàn di chuột' },
  { slug: 'tai-nghe', name: 'Tai Nghe', description: 'Tai nghe chụp tai Over-ear, tai nghe In-ear chơi game' },
  { slug: 'ghe-ban', name: 'Ghế - Bàn', description: 'Ghế gaming, ghế công thái học, bàn chơi game cao cấp' },
  { slug: 'handheld-console', name: 'Handheld Console', description: 'Máy chơi game cầm tay, tay cầm điều khiển' },
  { slug: 'phu-kien', name: 'Phụ kiện', description: 'Cáp sạc, củ sạc, hub chuyển đổi và phụ kiện khác' },
  { slug: 'dich-vu', name: 'Dịch vụ', description: 'Dịch vụ kỹ thuật sửa chữa tại nhà' }
];

async function startMigration() {
  console.log('🚀 === BẮT ĐẦU QUÁ TRÌNH DI CHUYỂN DỮ LIỆU GEARVN ===');

  // Bước 1: Đăng nhập với tư cách quản trị viên để lấy JWT token
  console.log('🔑 Đang đăng nhập hệ thống admin...');
  let token = '';
  try {
    const loginRes = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'migrator@techshop.com', password: 'Admin@123' })
    });
    if (!loginRes.ok) {
      throw new Error(`Đăng nhập thất bại: ${loginRes.status}`);
    }
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log('✅ Đăng nhập thành công, đã nhận được JWT Admin Token.');
  } catch (err) {
    console.error('❌ Thất bại khi đăng nhập hệ thống admin:', err.message);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Bước 2: Đồng bộ danh mục (Categories)
  console.log('📂 Đang lấy danh sách danh mục hiện có...');
  let dbCategories = [];
  try {
    const catRes = await fetch(`${GATEWAY_URL}/api/categories`);
    if (catRes.ok) {
      dbCategories = await catRes.json();
    }
  } catch (err) {
    console.warn('⚠️ Không thể kết nối lấy danh mục, sẽ tự động chèn mới.');
  }

  const categoryMap = {}; // slug -> id trong MySQL
  for (const cat of dbCategories) {
    categoryMap[cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')] = cat.id;
  }

  console.log('📂 Đang đồng bộ danh mục từ Menu GearVN...');
  for (const seedCat of CATEGORIES_TO_CREATE) {
    if (categoryMap[seedCat.slug]) {
      console.log(`   - Danh mục "${seedCat.name}" đã tồn tại (ID: ${categoryMap[seedCat.slug]})`);
      continue;
    }

    try {
      console.log(`   - Tạo mới danh mục: "${seedCat.name}"...`);
      const createRes = await fetch(`${GATEWAY_URL}/api/categories`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: seedCat.name,
          description: seedCat.description,
          slug: seedCat.slug,
          imageUrl: '' // Sẽ cập nhật sau
        })
      });
      if (createRes.ok) {
        const newCat = await createRes.json();
        categoryMap[seedCat.slug] = newCat.id;
        console.log(`     ✅ Đã tạo thành công. MySQL ID: ${newCat.id}`);
      } else {
        const errMsg = await createRes.text();
        console.error(`     ❌ Tạo danh mục thất bại: ${createRes.status} - ${errMsg}`);
      }
    } catch (err) {
      console.error(`     ❌ Lỗi kết nối tạo danh mục "${seedCat.name}":`, err.message);
    }
  }

  // Bước 3: Lấy sản phẩm từ Firestore REST API
  console.log('📡 Đang truy vấn dữ liệu sản phẩm từ Firestore...');
  let productsList = [];
  let nextPageToken = '';
  
  try {
    do {
      const url = `https://firestore.googleapis.com/v1/projects/gearvndb/databases/(default)/documents/products?pageSize=100${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Lỗi fetch Firestore: ${response.status}`);
      }
      const data = await response.json();
      const docs = data.documents || [];
      for (const doc of docs) {
        const rawFields = doc.fields || {};
        const parsed = {};
        for (const [k, v] of Object.entries(rawFields)) {
          parsed[k] = parseFirestoreValue(v);
        }
        productsList.push(parsed);
      }
      nextPageToken = data.nextPageToken || '';
    } while (nextPageToken);

    console.log(`✅ Tổng số sản phẩm nhận được từ Firestore: ${productsList.length}`);
  } catch (err) {
    console.error('❌ Lỗi khi lấy dữ liệu từ Firestore REST API:', err.message);
    process.exit(1);
  }

  // Bước 4: Di chuyển dữ liệu sản phẩm và tồn kho
  console.log('📦 Bắt đầu upload ảnh lên Cloudinary và lưu sản phẩm vào database MySQL...');
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < productsList.length; i++) {
    const rawProd = productsList[i];
    console.log(`\n🔄 [${i + 1}/${productsList.length}] Xử lý: "${rawProd.name}" (SKU: ${rawProd.id || 'N/A'})`);

    // Phân loại danh mục
    let catSlug = rawProd.category || 'phu-kien';
    if (catSlug === 'accessory') catSlug = 'phu-kien';
    if (catSlug === 'keyboard') catSlug = 'ban-phim';
    if (catSlug === 'monitor') catSlug = 'man-hinh';
    if (catSlug === 'speaker_micro_webcam') catSlug = 'loa-micro-webcam';
    if (catSlug === 'tables_chairs') catSlug = 'ghe-ban';
    if (catSlug === 'case_psu_cooler') catSlug = 'case-nguon-tan';
    if (catSlug === 'main_cpu_vga') catSlug = 'main-cpu-vga';
    if (catSlug === 'ssd_ram_sd') catSlug = 'o-cung-ram-the-nho';
    if (catSlug === 'handheld_console') catSlug = 'handheld-console';

    const categoryId = categoryMap[catSlug] || categoryMap['phu-kien'];

    // Upload danh sách hình ảnh lên Cloudinary
    const sourceImages = rawProd.images || [];
    const cloudinaryUrls = [];
    console.log(`   - Tải lên ${sourceImages.length} hình ảnh lên Cloudinary...`);
    for (const imgPath of sourceImages) {
      const url = await uploadToCloudinary(imgPath, catSlug);
      if (url) {
        cloudinaryUrls.push(url);
      }
    }

    const primaryImageUrl = cloudinaryUrls[0] || '';
    const imagesJsonString = JSON.stringify(cloudinaryUrls);

    // Chuẩn bị thông số kỹ thuật lưu dạng JSON String
    const specsData = {
      specs: rawProd.specs || {},
      cardSpecs: rawProd.cardSpecs || [],
      detailSpecs: rawProd.detailSpecs || []
    };
    const specificationsString = JSON.stringify(specsData);

    const productPayload = {
      name: rawProd.name,
      description: rawProd.description || '',
      price: rawProd.price || 0,
      salePrice: rawProd.salePrice || null,
      imageUrl: primaryImageUrl,
      images: imagesJsonString,
      brand: rawProd.brand || '',
      sku: rawProd.id || `PROD-${Date.now()}-${i}`,
      slug: rawProd.slug || rawProd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId: categoryId,
      specifications: specificationsString,
      subcategory: rawProd.subcategory || '',
      accessoryType: rawProd.accessoryType || ''
    };

    try {
      // Gọi API thêm sản phẩm
      const addProdRes = await fetch(`${GATEWAY_URL}/api/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(productPayload)
      });

      if (!addProdRes.ok) {
        const errTxt = await addProdRes.text();
        throw new Error(`Lưu sản phẩm thất bại: ${addProdRes.status} - ${errTxt}`);
      }

      const createdProduct = await addProdRes.json();
      console.log(`   ✅ Đã chèn sản phẩm vào MySQL thành công. ID: ${createdProduct.id}`);

      // Gọi API tạo tồn kho trong inventory-service
      const stockQty = typeof rawProd.stock === 'number' ? rawProd.stock : 20;
      const addInvRes = await fetch(`${GATEWAY_URL}/api/inventory`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          productId: createdProduct.id,
          quantity: stockQty,
          reservedQuantity: 0,
          lowStockThreshold: 5
        })
      });

      if (addInvRes.ok) {
        console.log(`   ✅ Đã khởi tạo tồn kho thành công: ${stockQty} sản phẩm.`);
      } else {
        const errTxt = await addInvRes.text();
        console.warn(`   ⚠️ Cảnh báo: Tạo tồn kho thất bại: ${addInvRes.status} - ${errTxt}`);
      }

      successCount++;
    } catch (err) {
      console.error(`   ❌ Thất bại khi đồng bộ sản phẩm này:`, err.message);
      failCount++;
    }
  }

  console.log('\n📊 === BÁO CÁO KẾT QUẢ DI CHUYỂN DỮ LIỆU ===');
  console.log(`   - Tổng sản phẩm xử lý: ${productsList.length}`);
  console.log(`   - Thành công: ${successCount}`);
  console.log(`   - Thất bại: ${failCount}`);
  console.log('============================================\n');
}

startMigration().catch(console.error);
