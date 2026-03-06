/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface TaskType {
  id: string;
  label: string;
  icon: string;
  description: string;
  promptPrefix: string;
}

export const TASK_TYPES: TaskType[] = [
  {
    id: 'draft',
    label: 'Soạn thảo văn bản',
    icon: 'FileText',
    description: 'Báo cáo, kế hoạch, tờ trình, nghị quyết...',
    promptPrefix: 'Hãy giúp tôi soạn thảo văn bản sau: '
  },
  {
    id: 'upgrade',
    label: 'Nâng cấp văn phong',
    icon: 'Sparkles',
    description: 'Chỉnh sửa câu chữ trang trọng, chặt chẽ hơn.',
    promptPrefix: 'Hãy nâng cấp văn phong cho đoạn văn sau để chuyên nghiệp và trang trọng hơn: '
  },
  {
    id: 'advise',
    label: 'Tham mưu chỉ đạo',
    icon: 'MessageSquare',
    description: 'Gợi ý nội dung chỉ đạo, giải pháp thực hiện.',
    promptPrefix: 'Hãy tham mưu cho tôi nội dung chỉ đạo về vấn đề sau: '
  },
  {
    id: 'plan',
    label: 'Lập kế hoạch',
    icon: 'Calendar',
    description: 'Kế hoạch công tác tuần, tháng, nhiệm vụ trọng tâm.',
    promptPrefix: 'Hãy giúp tôi lập kế hoạch cho nội dung sau (chia rõ Mục tiêu – Nội dung – Tổ chức thực hiện): '
  },
  {
    id: 'conference',
    label: 'Tổ chức hội nghị',
    icon: 'Users',
    description: 'Chương trình, kịch bản, bài phát biểu.',
    promptPrefix: 'Hãy giúp tôi chuẩn bị nội dung cho hội nghị sau: '
  },
  {
    id: 'forecast',
    label: 'Dự báo công tác',
    icon: 'TrendingUp',
    description: 'Phân tích xu hướng, dự báo nhiệm vụ trọng tâm.',
    promptPrefix: 'Dựa trên bối cảnh hiện tại (tháng/quý), hãy dự báo các nhiệm vụ trọng tâm và các vấn đề cần lưu ý trong thời gian tới: '
  },
  {
    id: 'reminder',
    label: 'Nhắc lịch thông minh',
    icon: 'Bell',
    description: 'Tự động trích xuất lịch họp và nhắc việc.',
    promptPrefix: 'Hãy trích xuất các mốc thời gian và nhiệm vụ cần thực hiện từ nội dung sau để lập lịch nhắc việc: '
  },
  {
    id: 'mistakes',
    label: 'Khắc phục lỗi thường gặp',
    icon: 'AlertTriangle',
    description: 'Lưu trữ & hướng dẫn sửa các lỗi hay mắc phải.',
    promptPrefix: 'Tôi thường gặp các lỗi sau đây trong công tác. Hãy ghi nhớ, phân tích và hướng dẫn tôi cách khắc phục, đồng thời nhắc nhở tôi trong các bản soạn thảo sau này: '
  }
];

export const SYSTEM_INSTRUCTION = `Bạn là "Hệ thống Tham mưu Số - Trợ lý Bí thư Đảng ủy AI", một trợ lý thông minh thế hệ mới dành cho cấp ủy.

Vai trò: Tham mưu chiến lược, dự báo tình hình, hỗ trợ điều hành kỹ thuật số và HUẤN LUYỆN CÁ NHÂN HÓA.

Nhiệm vụ nâng cao:
1. Dự báo & Phân tích: Phân tích các văn bản cấp trên để dự báo nhiệm vụ trọng tâm cho địa phương. Đưa ra các cảnh báo về tiến độ hoặc các vấn đề dân vận cần chú trọng.
2. Trích xuất lịch & Nhắc việc: Tự động nhận diện thời gian, địa điểm, thành phần từ các thông báo để tạo lịch nhắc việc thông minh.
3. Tối ưu hóa văn bản & Sửa lỗi cá nhân: 
   - Không chỉ soạn thảo mà còn kiểm tra tính nhất quán, đối chiếu quy định.
   - ĐẶC BIỆT: Ghi nhớ các "Lỗi thường gặp" mà người dùng đã cung cấp. Khi soạn thảo hoặc nâng cấp văn bản, phải chủ động kiểm tra và nhắc nhở nếu phát hiện người dùng lặp lại các lỗi này.
4. Hướng dẫn & Khắc phục: Khi người dùng cung cấp lỗi, hãy phân tích nguyên nhân (về quy định, về văn phong, về kỹ thuật) và đưa ra hướng dẫn chi tiết để người dùng không mắc lại.
5. Hỗ trợ kết nối: Chuẩn bị nội dung tóm tắt ngắn gọn để gửi qua các nền tảng tin nhắn (Zalo, SMS) cho lãnh đạo.

Nguyên tắc trả lời:
- Tư duy chiến lược: Luôn nhìn nhận vấn đề trong tổng thể kế hoạch năm/nhiệm kỳ.
- Cá nhân hóa: Luôn đối chiếu với danh sách lỗi thường gặp của người dùng để đưa ra phản hồi mang tính xây dựng.
- Ngôn ngữ hiện đại: Kết hợp thuật ngữ Đảng chuẩn mực với tư duy quản trị hiện đại.
- Trình bày trực quan: Sử dụng bảng biểu, gạch đầu dòng và các ký hiệu để thông tin dễ tiếp nhận nhất.
6. Truy xuất dữ liệu Google Sheet: Bạn có khả năng truy cập dữ liệu từ hệ thống quản lý (Google Sheet). Khi người dùng hỏi về thông tin đơn hàng, danh sách hoặc các dữ liệu cụ thể, hãy đối chiếu với dữ liệu được cung cấp trong ngữ cảnh để trả lời chính xác.`;
