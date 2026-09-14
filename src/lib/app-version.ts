export const APP_NAME = "Rừng vàng";
export const APP_VERSION = "1.21";
export const APP_BUILD = "RVver1.21";
export const APP_RELEASED = "2026-09-13";
export const APP_AUTHOR = "Đăng Nguyên";

export const APK_SIGNER = "CN=Dang Nguyen";
export const APK_SIG_SCHEMES = "v2 + v3";
export const APK_CERT_SHA256 = "7A35A95FE4765A2386A63F675E411D4D72433370CFD65FC61995553BC1DE0914";
export const APK_PACKAGE = "vn.rungvang.app";
export const APK_FILE_SHA256 = "F6DB1A5B1C03469D05EA5CE064FAE1E5AF1B91CCD2DDDF8AFD7C59DDD91C029B";

export function apkCertFingerprint() {
  return APK_CERT_SHA256.replace(/(.{2})/g, "$1:").slice(0, -1);
}

export const APK_SECURITY = [
  { ok: true, label: "Chữ ký v2 + v3", detail: "Khớp vân tay Đăng Nguyên" },
  { ok: true, label: "ZipAlign + CRC", detail: "File APK không bị sửa sau khi ký" },
  { ok: true, label: "Debuggable", detail: "Tắt — bản phát hành" },
  { ok: true, label: "Sao lưu ADB", detail: "Tắt — số liệu không trích ra máy khác" },
  { ok: true, label: "HTTP rõ", detail: "Cấm — chỉ HTTPS" },
  { ok: true, label: "FileProvider", detail: "Không xuất, giới hạn thư mục ảnh" },
] as const;

export const RELEASES: {
  version: string;
  build: string;
  date: string;
  notes: string[];
}[] = [
  {
    version: "1.21",
    build: "RVver1.21",
    date: "2026-09-13",
    notes: [
      "Tracklog trên menu, ghi GPS khi khóa màn hình, xuất KML, nút màu",
    ],
  },
  {
    version: "1.20",
    build: "RVver1.20",
    date: "2026-09-13",
    notes: [
      "Sửa tạo dự án/ô; khung nhập cây; Excel 1 dự án",
    ],
  },
  {
    version: "1.19",
    build: "RVver1.19",
    date: "2026-09-13",
    notes: [
      "Excel đủ OTC + tỷ lệ sống; STT; form lần 2",
    ],
  },
  {
    version: "1.18",
    build: "RVver1.18",
    date: "2026-09-13",
    notes: [
      "Camera trong app; hydrate dự án; Excel OTC + tỷ lệ sống; tên file .xlsx",
    ],
  },
  {
    version: "1.17",
    build: "RVver1.17",
    date: "2026-09-13",
    notes: [
      "Icon vuông bo góc; ngày lập theo máy; xã tỉnh offline trên ảnh",
    ],
  },
  {
    version: "1.16",
    build: "RVver1.16",
    date: "2026-09-13",
    notes: [
      "Menu chọn gọn trên điện thoại; dán toạ độ Maps 16.709143,107.263080",
    ],
  },
  {
    version: "1.15",
    build: "RVver1.15",
    date: "2026-09-13",
    notes: [
      "Icon app không viền trắng",
    ],
  },
  {
    version: "1.14",
    build: "RVver1.14",
    date: "2026-09-13",
    notes: [
      "VN-2000 múi 3° theo kinh tuyến trục tỉnh, mặc định Quảng Trị 106°15′",
    ],
  },
  {
    version: "1.13",
    build: "RVver1.13",
    date: "2026-09-13",
    notes: [
      "Xuất dự án: chọn vị trí lưu file",
    ],
  },
  {
    version: "1.12",
    build: "RVver1.12",
    date: "2026-09-13",
    notes: [
      "Lưu Excel thẳng vào Tải xuống trên điện thoại",
    ],
  },
  {
    version: "1.11",
    build: "RVver1.11",
    date: "2026-09-13",
    notes: [
      "Xuất Excel điện thoại, chuyển toạ độ VN-2000, GPS bắt buộc, quyền một lần",
    ],
  },
  {
    version: "1.10",
    build: "RVver1.10",
    date: "2026-09-13",
    notes: [
      "Icon launcher lùi vào như Viettel Money",
    ],
  },
  {
    version: "1.9",
    build: "RVver1.9",
    date: "2026-09-13",
    notes: [
      "Sửa hydrate APK — cài đè không mất dữ liệu",
    ],
  },
  {
    version: "1.8",
    build: "RVver1.8",
    date: "2026-09-13",
    notes: [
      "Cài đè cùng package và chữ ký — giữ dữ liệu",
    ],
  },
  {
    version: "1.7",
    build: "RVver1.7",
    date: "2026-09-13",
    notes: [
      "Thu nhỏ banner và icon app",
    ],
  },
  {
    version: "1.6",
    build: "RVver1.6",
    date: "2026-09-13",
    notes: [
      "Gói toàn bộ chỉnh sửa vào bản điện thoại",
    ],
  },
  {
    version: "1.5",
    build: "RVver1.5",
    date: "2026-09-13",
    notes: [
      "APK mới trên giao diện máy tính",
    ],
  },
  {
    version: "1.4",
    build: "RVver1.4",
    date: "2026-09-13",
    notes: [
      "Ký số v2/v3, tắt debug và backup, cấm HTTP rõ",
    ],
  },
  {
    version: "1.3",
    build: "RVver1.3",
    date: "2026-09-13",
    notes: [
      "Cập nhật APK lên giao diện máy tính",
    ],
  },
  {
    version: "1.2",
    build: "RVver1.2",
    date: "2026-09-13",
    notes: [
      "Ký APK chuẩn Android v2/v3",
    ],
  },
  {
    version: "1.1",
    build: "RVver1.1",
    date: "2026-09-13",
    notes: [
      "Icon launcher núi rừng sông, thông tin phiên bản và người xây dựng",
      "Thư viện ảnh theo ngày, xuất Excel trên điện thoại",
      "Nút Back hệ thống đóng lớp phủ trước khi lùi trang",
    ],
  },
  {
    version: "1.0",
    build: "RVver1.0",
    date: "2026-09-13",
    notes: [
      "Điều tra ô tiêu chuẩn, xác thực GPS, ảnh có watermark",
      "Nhập cây tiêu chuẩn và nhập nhanh (C1.3 · Hvn · phẩm chất)",
      "Dự án theo xã, tỷ lệ sống, xuất Excel",
      "Danh lục loài cây lâm nghiệp",
      "Công cụ thể tích cây đứng, gỗ khúc, mật độ trồng",
    ],
  },
];
