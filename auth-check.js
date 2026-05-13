// auth-check.js - Cửa sổ đăng nhập bắt buộc cho mỗi phiên

(function() {
    // Hàm kiểm tra đăng nhập
    function checkLogin() {
        // Sử dụng sessionStorage (tự động xóa khi đóng tab/trình duyệt)
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        
        if (!isLoggedIn) {
            // Chưa đăng nhập trong phiên này, hiển thị modal
            showLoginModal();
        }
    }

    // Hàm hiển thị modal đăng nhập
    function showLoginModal() {
        // Tạo overlay
        const overlay = document.createElement('div');
        overlay.id = 'loginOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        `;

        // Tạo modal content
        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 420px;
            width: 90%;
            padding: 45px 35px;
            animation: slideUp 0.5s ease;
        `;

        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; color: white;">🏫</div>
                <h2 style="font-size: 28px; color: #1e3c72; margin: 0 0 8px 0; font-weight: 700;">Đăng Nhập</h2>
                <p style="font-size: 14px; color: #7f8c8d; margin: 0;">Hệ thống quản lý bán trú thông minh</p>
            </div>

            <div id="errorMsg" style="background: #fee; color: #c33; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: none; font-size: 14px; border-left: 4px solid #c33;"></div>

            <form id="modalLoginForm" style="margin-bottom: 25px;">
                <div style="margin-bottom: 18px;">
                    <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 600; font-size: 14px;">
                        <i class="fas fa-user" style="margin-right: 6px;"></i> Tên Đăng Nhập
                    </label>
                    <input type="text" id="modalUsername" placeholder="Nhập tên đăng nhập" style="width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 14px; font-family: inherit; transition: all 0.3s ease;" required />
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 600; font-size: 14px;">
                        <i class="fas fa-lock" style="margin-right: 6px;"></i> Mật Khẩu
                    </label>
                    <input type="password" id="modalPassword" placeholder="Nhập mật khẩu" style="width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 14px; font-family: inherit; transition: all 0.3s ease;" required />
                </div>

                <button type="submit" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease;">
                    <i class="fas fa-sign-in-alt"></i> Đăng Nhập
                </button>
            </form>

            <div style="text-align: center; font-size: 13px; color: #7f8c8d;">
                <strong style="display: block; margin-bottom: 10px; color: #1e3c72;">📋 Tài Khoản Demo:</strong>
                <p style="margin: 4px 0;">👤 Tên: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">admin</code></p>
                <p style="margin: 4px 0;">🔑 MK: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">123456</code></p>
            </div>
        `;

        // Thêm style animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            #modalUsername:focus,
            #modalPassword:focus {
                outline: none;
                border-color: #2a5298;
                box-shadow: 0 0 0 3px rgba(42, 82, 152, 0.1);
            }
            
            #modalLoginForm button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(42, 82, 152, 0.3);
            }
        `;
        document.head.appendChild(style);

        // Thêm vào body
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Focus vào input tên đăng nhập
        setTimeout(() => {
            document.getElementById('modalUsername').focus();
        }, 100);

        // Xử lý form submit
        document.getElementById('modalLoginForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('modalUsername').value;
            const password = document.getElementById('modalPassword').value;
            const errorMsg = document.getElementById('errorMsg');

            // Kiểm tra đăng nhập
            if (username === 'admin' && password === '123456') {
                // Lưu thông tin đăng nhập vào sessionStorage (tự động xóa khi đóng tab)
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('currentUser', username);
                sessionStorage.setItem('loginTime', new Date().toISOString());

                // Cập nhật localStorage nếu cần
                localStorage.setItem('currentUser', username);

                // Ẩn modal
                overlay.style.display = 'none';
                
                // Tải lại trang để hiển thị nội dung
                if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                    location.reload();
                }
            } else {
                errorMsg.textContent = '❌ Tên đăng nhập hoặc mật khẩu không chính xác!';
                errorMsg.style.display = 'block';
                document.getElementById('modalPassword').value = '';
                setTimeout(() => {
                    errorMsg.style.display = 'none';
                }, 3000);
            }
        });

        // Ngăn chặn nhấp vào overlay để ẩn
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                // Không cho phép đóng bằng cách nhấp ngoài
                return false;
            }
        });
    }

    // Chạy kiểm tra khi DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkLogin);
    } else {
        checkLogin();
    }
})();
