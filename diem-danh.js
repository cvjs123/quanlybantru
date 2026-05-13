// Data storage
let attendanceRecords = [];
let allStudents = [];
let allTeachers = [];
let schoolInfo = {};
let cameraStream = null;
let scanAnimationId = null;
let selectedSession = 'morning'; // Track selected session: 'morning', 'afternoon', 'evening'
let lastScanTime = 0; // Track last scan time for 5s cooldown between scans

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSchoolInfo();
    loadStudentsData();
    loadTeachersData();
    setupEventListeners();
    loadAttendanceFromLocalStorage();
    updateStatistics();
    
    // Listen for changes from quan-ly-hoc-sinh.html and nha-truong.html
    const channel = typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('schoolDataUpdates')
        : null;
    
    if (channel) {
        channel.onmessage = function(e) {
            if (e.data.type === 'studentUpdated') {
                loadStudentsData();
                updateStudentSelect();
            }
            if (e.data.type === 'teacherUpdated') {
                loadTeachersData();
                updateTeacherSelect();
            }
        };
    }
});

// Load school info from nha-truong.html
function loadSchoolInfo() {
    // Lấy thông tin nhà trường từ localStorage
    const schoolData = JSON.parse(localStorage.getItem('schoolInfo')) || {};
    
    schoolInfo = {
        name: schoolData.name || 'Trường PTDTBT THCS Hùng Lợi',
        address: schoolData.address || 'Địa chỉ nhà trường',
        phone: schoolData.phone || '0274 3 840 xxx',
        email: schoolData.email || 'truong@hungloi.edu.vn',
        website: schoolData.website || 'www.hungloi.edu.vn'
    };

    const schoolElement = document.getElementById('schoolInfo');
    schoolElement.innerHTML = `
        <h3>${schoolInfo.name}</h3>
        <p><i class="fas fa-map-marker-alt"></i> ${schoolInfo.address}</p>
        <p><i class="fas fa-phone"></i> ${schoolInfo.phone}</p>
    `;
}

// Load students from quan-ly-hoc-sinh data (localStorage)
function loadStudentsData() {
    // Lấy dữ liệu từ localStorage được lưu từ quan-ly-hoc-sinh.html
    const studentsData = JSON.parse(localStorage.getItem('students')) || [];
    
    // Convert to the format needed for diem-danh
    allStudents = studentsData.map(student => ({
        id: student.id,
        name: student.name,
        class: student.sClass,
        room: student.room,
        dob: student.dob,
        gender: student.gender,
        address: student.address,
        phone: student.phone,
        parent: student.parent,
        photo: student.photo
    }));

    // Nếu không có dữ liệu trong localStorage, dùng dữ liệu mẫu
    if (allStudents.length === 0) {
        allStudents = [
            { id: 'HS001', name: 'Nguyễn Văn A', class: '6A1', room: 'A101' },
            { id: 'HS002', name: 'Trần Thị B', class: '6A1', room: 'A101' },
            { id: 'HS003', name: 'Lê Văn C', class: '6A2', room: 'A102' },
            { id: 'HS004', name: 'Phạm Thị D', class: '6A2', room: 'A102' },
            { id: 'HS005', name: 'Hoàng Văn E', class: '7A1', room: 'B101' },
            { id: 'HS006', name: 'Vũ Thị F', class: '7A1', room: 'B101' },
            { id: 'HS007', name: 'Đặng Văn G', class: '7A2', room: 'B102' },
            { id: 'HS008', name: 'Cao Thị H', class: '7A2', room: 'B102' },
            { id: 'HS009', name: 'Bùi Văn I', class: '8A1', room: 'C101' },
            { id: 'HS010', name: 'Dương Thị J', class: '8A1', room: 'C101' }
        ];
    }

    updateStudentSelect();
}

// Load teachers from phong-o data (rooms)
function loadTeachersData() {
    try {
        // Lấy dữ liệu từ phong-o (rooms) vì có đủ thông tin: tên, mã, bộ môn, SDT, ảnh
        const roomsData = JSON.parse(localStorage.getItem('rooms')) || [];
        
        allTeachers = [];
        roomsData.forEach(room => {
            if (room.teacherName) {
                const teacher = {
                    id: room.teacherID || `GV_${room.teacherName.replace(/\s+/g, '')}`,
                    name: room.teacherName,
                    subject: room.department || 'CBGV',
                    phone: room.teacherPhone || '',
                    email: room.teacherEmail || '',
                    room: room.roomName || '',
                    image: room.teacherImage || null
                };
                // Kiểm tra không trùng lặp
                if (!allTeachers.find(t => t.name === teacher.name)) {
                    allTeachers.push(teacher);
                }
            }
        });
        
        // Nếu vẫn không có dữ liệu, dùng mẫu
        if (allTeachers.length === 0) {
            allTeachers = [
                { id: 'GV001', name: 'Nguyễn Thị Hà', room: 'A101', phone: '0987013380', subject: 'Toán' },
                { id: 'GV002', name: 'Lê Thị Hường', room: 'A102', phone: '0975605814', subject: 'Văn' },
                { id: 'GV003', name: 'Trần Văn Hùng', room: 'B101', phone: '0961234567', subject: 'Anh' }
            ];
        }
    } catch (e) {
        console.log('Lỗi tải giáo viên:', e);
    }

    updateTeacherSelect();
}

// Update student select dropdown
function updateStudentSelect() {
    const select = document.getElementById('studentSelect');
    select.innerHTML = '<option value="">-- Chọn học sinh --</option>';
    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.class}) - ${student.room}`;
        select.appendChild(option);
    });
}

// Update teacher select dropdown
function updateTeacherSelect() {
    const select = document.getElementById('teacherSelect');
    select.innerHTML = '<option value="">-- Chọn giáo viên --</option>';
    allTeachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.name} (${teacher.room}) - ${teacher.subject || 'CBGV'}`;
        select.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Session buttons
    const sessionBtns = document.querySelectorAll('.session-btn');
    sessionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            sessionBtns.forEach(b => {
                b.classList.remove('session-selected');
                b.style.border = '2px solid #ddd';
                b.style.background = 'white';
            });
            e.target.closest('.session-btn').classList.add('session-selected');
            e.target.closest('.session-btn').style.border = '2px solid #FFD700';
            e.target.closest('.session-btn').style.background = '#fffacd';
            selectedSession = e.target.closest('.session-btn').dataset.session;
            
            // Update table and statistics when session changes
            updateAttendanceTable();
            updateStatistics();
        });
    });

    // QR Input - auto-process any input without needing Enter
    const qrInputEl = document.getElementById('qrInput');
    if (qrInputEl) {
        qrInputEl.addEventListener('input', (e) => {
            const qrCode = e.target.value.trim();
            if (qrCode.length >= 3) {
                const now = Date.now();
                if (now - lastScanTime >= 5000) {
                    lastScanTime = now;
                    
                    const foundStudent = allStudents.find(s => s.id === qrCode);
                    const foundTeacher = allTeachers.find(t => t.id === qrCode);
                    
                    if (foundStudent || foundTeacher) {
                        processQrCode(qrCode);
                        e.target.value = '';
                    }
                }
            }
        });
    }
    
    // Scanner input - auto-process barcode scanner input
    const scannerEl = document.getElementById('scannerInput');
    if (scannerEl) {
        scannerEl.addEventListener('input', (e) => {
            const qrCode = e.target.value.trim();
            if (qrCode.length >= 3) {
                const now = Date.now();
                if (now - lastScanTime >= 5000) {
                    lastScanTime = now;
                    
                    const foundStudent = allStudents.find(s => s.id === qrCode);
                    const foundTeacher = allTeachers.find(t => t.id === qrCode);
                    
                    if (foundStudent || foundTeacher) {
                        processQrCode(qrCode);
                        e.target.value = '';
                    }
                }
            }
        });
    }

    // Camera Modal
    const cameraBtnModal = document.getElementById('cameraBtnModal');
    const closeCameraModal = document.getElementById('closeCameraModal');
    const startCameraBtn = document.getElementById('startCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    const confirmCameraBtn = document.getElementById('confirmCameraBtn');
    const cancelCameraBtn = document.getElementById('cancelCameraBtn');
    
    if (cameraBtnModal) {
        cameraBtnModal.addEventListener('click', () => {
            document.getElementById('cameraModal').style.display = 'block';
        });
    }

    if (closeCameraModal) {
        closeCameraModal.addEventListener('click', () => {
            stopCamera();
            document.getElementById('cameraModal').style.display = 'none';
        });
    }

    if (startCameraBtn) startCameraBtn.addEventListener('click', startCamera);
    if (stopCameraBtn) stopCameraBtn.addEventListener('click', stopCamera);
    
    if (confirmCameraBtn) {
        confirmCameraBtn.addEventListener('click', () => {
            const qrCode = document.getElementById('cameraQrResult').value;
            if (qrCode) {
                const now = Date.now();
                if (now - lastScanTime >= 5000) {
                    lastScanTime = now;
                    processQrCode(qrCode);
                    document.getElementById('cameraModal').style.display = 'none';
                    stopCamera();
                }
            }
        });
    }

    if (cancelCameraBtn) {
        cancelCameraBtn.addEventListener('click', () => {
            stopCamera();
            document.getElementById('cameraModal').style.display = 'none';
        });
    }

    // Student Modal
    const createStudentBtn = document.getElementById('createStudentBtn');
    const closeStudentModal = document.getElementById('closeStudentModal');
    const cancelStudentBtn = document.getElementById('cancelStudentBtn');
    
    if (createStudentBtn) {
        createStudentBtn.addEventListener('click', () => {
            clearStudentForm();
            document.getElementById('studentModal').style.display = 'block';
        });
    }

    if (closeStudentModal) {
        closeStudentModal.addEventListener('click', () => {
            document.getElementById('studentModal').style.display = 'none';
        });
    }

    if (cancelStudentBtn) {
        cancelStudentBtn.addEventListener('click', () => {
            document.getElementById('studentModal').style.display = 'none';
        });
    }
    
    // Student form handlers
    const studentSelectEl = document.getElementById('studentSelect');
    const studentFormImageEl = document.getElementById('studentFormImage');
    
    if (studentSelectEl) {
        studentSelectEl.addEventListener('change', loadStudentToForm);
    }
    if (studentFormImageEl) {
        studentFormImageEl.addEventListener('change', previewStudentImage);
    }
    
    ['studentFormName', 'studentFormID', 'studentFormClass', 'studentFormRoom', 'studentFormSchool'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateStudentCardPreview);
        }
    });
    
    const studentExportBtn = document.getElementById('studentExportImageBtn');
    const studentPrintBtn = document.getElementById('studentPrintBtn');
    if (studentExportBtn) studentExportBtn.addEventListener('click', exportStudentCard);
    if (studentPrintBtn) studentPrintBtn.addEventListener('click', printStudentCard);

    // Teacher Modal
    const createTeacherBtn = document.getElementById('createTeacherBtn');
    const closeTeacherModal = document.getElementById('closeTeacherModal');
    const cancelTeacherBtn = document.getElementById('cancelTeacherBtn');
    
    if (createTeacherBtn) {
        createTeacherBtn.addEventListener('click', () => {
            clearTeacherForm();
            document.getElementById('teacherModal').style.display = 'block';
        });
    }

    if (closeTeacherModal) {
        closeTeacherModal.addEventListener('click', () => {
            document.getElementById('teacherModal').style.display = 'none';
        });
    }

    if (cancelTeacherBtn) {
        cancelTeacherBtn.addEventListener('click', () => {
            document.getElementById('teacherModal').style.display = 'none';
        });
    }

    // Teacher form handlers
    const teacherSelectEl = document.getElementById('teacherSelect');
    const teacherFormImageEl = document.getElementById('teacherFormImage');
    
    if (teacherSelectEl) {
        teacherSelectEl.addEventListener('change', loadTeacherToForm);
    }
    if (teacherFormImageEl) {
        teacherFormImageEl.addEventListener('change', previewTeacherImage);
    }
    ['teacherFormName', 'teacherFormID', 'teacherFormDept', 'teacherFormPhone', 'teacherFormSchool'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateTeacherCardPreview);
        }
    });
    
    const exportBtn = document.getElementById('teacherExportImageBtn');
    const printBtn = document.getElementById('teacherPrintBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportTeacherCard);
    if (printBtn) printBtn.addEventListener('click', printTeacherCard);

    // Missing Students Modal
    const missingStudentsBtn = document.getElementById('missingStudentsBtn');
    const closeMissingModal = document.getElementById('closeMissingModal');
    
    if (missingStudentsBtn) {
        missingStudentsBtn.addEventListener('click', showMissingStudents);
    }
    if (closeMissingModal) {
        closeMissingModal.addEventListener('click', () => {
            document.getElementById('missingModal').style.display = 'none';
        });
    }

    const closeMissingBtn = document.getElementById('closeMissingBtn');
    if (closeMissingBtn) {
        closeMissingBtn.addEventListener('click', () => {
            document.getElementById('missingModal').style.display = 'none';
        });
    }

    // New button functions
    const clearAttendanceBtn = document.getElementById('clearAttendanceBtn');
    const printAttendanceBtn = document.getElementById('printAttendanceBtn');
    const statisticsBtn = document.getElementById('statisticsBtn');
    
    if (clearAttendanceBtn) {
        clearAttendanceBtn.addEventListener('click', clearAllAttendance);
    }
    if (printAttendanceBtn) {
        printAttendanceBtn.addEventListener('click', printAttendanceList);
    }
    if (statisticsBtn) {
        statisticsBtn.addEventListener('click', showStatistics);
    }

    // Statistics Modal
    const closeStatisticsModal = document.getElementById('closeStatisticsModal');
    const closeStatisticsBtn = document.getElementById('closeStatisticsBtn');
    
    if (closeStatisticsModal) {
        closeStatisticsModal.addEventListener('click', () => {
            document.getElementById('statisticsModal').style.display = 'none';
        });
    }
    if (closeStatisticsBtn) {
        closeStatisticsBtn.addEventListener('click', () => {
            document.getElementById('statisticsModal').style.display = 'none';
        });
    }

    // Export functions
    const exportZipBtn = document.getElementById('exportZipBtn');
    const exportAttendanceBtn = document.getElementById('exportAttendanceBtn');
    
    if (exportZipBtn) exportZipBtn.addEventListener('click', showExportZipModal);
    if (exportAttendanceBtn) exportAttendanceBtn.addEventListener('click', exportAttendance);

    // Export ZIP Modal
    const closeExportZipModal = document.getElementById('closeExportZipModal');
    const cancelExportZipBtn = document.getElementById('cancelExportZipBtn');
    const confirmExportZipBtn = document.getElementById('confirmExportZipBtn');
    
    if (closeExportZipModal) {
        closeExportZipModal.addEventListener('click', () => {
            document.getElementById('exportZipModal').style.display = 'none';
        });
    }
    
    if (cancelExportZipBtn) {
        cancelExportZipBtn.addEventListener('click', () => {
            document.getElementById('exportZipModal').style.display = 'none';
        });
    }
    
    if (confirmExportZipBtn) {
        confirmExportZipBtn.addEventListener('click', exportCardsAsZipWithOptions);
    }

    // Student filter radio buttons
    const studentFilterRadios = document.querySelectorAll('input[name="studentFilter"]');
    const classFilterSelect = document.getElementById('classFilterSelect');
    const roomFilterSelect = document.getElementById('roomFilterSelect');
    
    if (studentFilterRadios.length > 0) {
        studentFilterRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                classFilterSelect.disabled = e.target.value !== 'byClass';
                roomFilterSelect.disabled = e.target.value !== 'byRoom';
            });
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            stopCamera();
        }
    });
}

// Process QR code
function processQrCode(qrCode) {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    let personData = null;
    let personType = 'unknown';

    // Check if it's a student
    const student = allStudents.find(s => s.id === qrCode);
    if (student) {
        personData = student;
        personType = 'Học sinh';
    }

    // Check if it's a teacher
    const teacher = allTeachers.find(t => t.id === qrCode);
    if (teacher) {
        personData = teacher;
        personType = 'Giáo viên';
    }

    if (personData) {
        // Map session to Vietnamese labels
        const sessionLabels = {
            'morning': 'Sáng',
            'afternoon': 'Trưa',
            'evening': 'Tối'
        };

        // Check if already attended in this session today
        const today = new Date().toLocaleDateString('vi-VN');
        const alreadyAttended = attendanceRecords.find(r => 
            r.id === qrCode && 
            r.date === today && 
            r.session === selectedSession
        );

        if (alreadyAttended) {
            showErrorMessage(`${personType} ${personData.name} đã điểm danh buổi ${sessionLabels[selectedSession]} rồi!`);
            return;
        }

        // Add to attendance records
        const record = {
            id: qrCode,
            name: personData.name,
            type: personType,
            room: personData.room || personData.class,
            timestamp: timestamp,
            date: today,
            session: selectedSession,
            sessionLabel: sessionLabels[selectedSession]
        };

        attendanceRecords.push(record);
        saveAttendanceToLocalStorage();
        updateAttendanceTable();
        updateStatistics();

        // Show success feedback
        showSuccessMessage(`Ghi nhận ${personType}: ${personData.name} (buổi ${sessionLabels[selectedSession]})`);
    } else {
        showErrorMessage(`Không tìm thấy mã QR: ${qrCode}`);
    }
}

// Start camera
async function startCamera() {
    const video = document.getElementById('video');
    const qrResultInput = document.getElementById('cameraQrResult');

    qrResultInput.value = '';

    if (!window.isSecureContext) {
        showErrorMessage('Camera chi hoat dong tren HTTPS hoac localhost. Hay chay trang bang may chu noi bo.');
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showErrorMessage('Trinh duyet khong ho tro truy cap camera.');
        return;
    }

    stopCamera();

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        video.srcObject = cameraStream;
        await video.play();
        startQrScanning(video);
    } catch (err) {
        showErrorMessage('Khong the truy cap camera: ' + err.message);
    }
}

// Stop camera
function stopCamera() {
    const video = document.getElementById('video');

    if (scanAnimationId) {
        cancelAnimationFrame(scanAnimationId);
        scanAnimationId = null;
    }

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    if (video.srcObject) {
        video.srcObject = null;
    }

    video.dataset.scanning = 'false';
}

// Scan QR frames from the active camera stream
function startQrScanning(video) {
    if (typeof jsQR === 'undefined') {
        showErrorMessage('Thu vien quet QR chua tai xong. Hay kiem tra ket noi Internet va thu lai.');
        stopCamera();
        return;
    }

    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');
    const qrResultInput = document.getElementById('cameraQrResult');

    video.dataset.scanning = 'true';
    
    function scan() {
        if (video.dataset.scanning !== 'true' || !video.srcObject) {
            return;
        }

        if (!video.videoWidth || !video.videoHeight) {
            scanAnimationId = requestAnimationFrame(scan);
            return;
        }

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
        });
        
        if (code) {
            const qrCode = code.data.trim();
            
            // Check if QR code exists in students or teachers
            const foundStudent = allStudents.find(s => s.id === qrCode);
            const foundTeacher = allTeachers.find(t => t.id === qrCode);
            
            if (foundStudent || foundTeacher) {
                // Check 5 second cooldown between scans
                const now = Date.now();
                if (now - lastScanTime >= 5000) {
                    lastScanTime = now;
                    
                    // Automatically process without waiting for confirmation
                    qrResultInput.value = qrCode;
                    processQrCode(qrCode);
                    
                    // Clear input and continue scanning for next person
                    qrResultInput.value = '';
                    // Keep camera running and continue scanning
                    // Don't close modal, don't stop camera - just continue
                }
            }
        }
        
        scanAnimationId = requestAnimationFrame(scan);
    }

    scan();
}

// Load student to form
function loadStudentToForm() {
    try {
        const studentId = document.getElementById('studentSelect').value;
        if (!studentId) {
            clearStudentForm();
            return;
        }

        const student = allStudents.find(s => s.id === studentId);
        if (student) {
            const nameEl = document.getElementById('studentFormName');
            const idEl = document.getElementById('studentFormID');
            const classEl = document.getElementById('studentFormClass');
            const roomEl = document.getElementById('studentFormRoom');
            const schoolEl = document.getElementById('studentFormSchool');
            const imagePreview = document.getElementById('studentFormImagePreview');
            
            if (nameEl) nameEl.value = student.name || '';
            if (idEl) idEl.value = student.id || '';
            if (classEl) classEl.value = student.class || '';
            if (roomEl) roomEl.value = student.room || '';
            if (schoolEl) schoolEl.value = schoolInfo.name || 'Trường PTDTBT THCS Hùng Lợi';
            
            if (student.image && imagePreview) {
                imagePreview.src = student.image;
                imagePreview.style.display = 'block';
            }
            
            // Trigger preview update
            setTimeout(() => {
                updateStudentCardPreview();
            }, 100);
        }
    } catch (e) {
        console.error('Lỗi tải dữ liệu học sinh:', e);
    }
}

// Preview student image
function previewStudentImage(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = event.target.result;
            document.getElementById('studentFormImagePreview').src = imageData;
            document.getElementById('studentFormImagePreview').style.display = 'block';
            updateStudentCardPreview();
        };
        reader.readAsDataURL(file);
    }
}

// Update student card preview
function updateStudentCardPreview() {
    try {
        const nameEl = document.getElementById('studentFormName');
        const idEl = document.getElementById('studentFormID');
        const classEl = document.getElementById('studentFormClass');
        const roomEl = document.getElementById('studentFormRoom');
        const schoolEl = document.getElementById('studentFormSchool');
        const imagePreview = document.getElementById('studentFormImagePreview');
        
        if (!nameEl || !idEl || !classEl || !roomEl) {
            return;
        }
        
        const name = nameEl.value.trim() || 'LỲ THỊ CHIỀU';
        const id = idEl.value.trim() || 'HS0013';
        const studentClass = classEl.value.trim() || '7A';
        const room = roomEl.value.trim() || 'B105';
        
        // Update text fields
        const nameCard = document.getElementById('studentCardName');
        const idCard = document.getElementById('studentCardID');
        const classCard = document.getElementById('studentCardClass');
        const roomCard = document.getElementById('studentCardRoom');
        
        if (nameCard) nameCard.textContent = name;
        if (idCard) idCard.textContent = id;
        if (classCard) classCard.textContent = studentClass;
        if (roomCard) roomCard.textContent = room;
        
        // Generate QR Code
        try {
            const qrContainer = document.getElementById('studentCardQR');
            if (qrContainer && id && id !== 'HS0013') {
                qrContainer.innerHTML = '';
                new QRCode(qrContainer, {
                    text: id,
                    width: 80,
                    height: 80,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else if (qrContainer && id === 'HS0013') {
                // Generate sample QR for default
                qrContainer.innerHTML = '';
                new QRCode(qrContainer, {
                    text: 'HS0013',
                    width: 80,
                    height: 80,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        } catch (e) {
            console.log('Lỗi sinh QR code:', e);
        }
    } catch (e) {
        console.error('Lỗi cập nhật preview thẻ:', e);
    }
}

// Clear student form
function clearStudentForm() {
    const fields = ['studentFormName', 'studentFormID', 'studentFormClass', 'studentFormRoom', 'studentFormSchool', 'studentFormImage'];
    fields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    const imagePreview = document.getElementById('studentFormImagePreview');
    if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    
    updateStudentCardPreview();
}

// Export student card as image
function exportStudentCard() {
    const name = document.getElementById('studentFormName').value;
    if (!name) {
        showErrorMessage('Vui lòng nhập tên học sinh!');
        return;
    }
    
    const cardElement = document.getElementById('studentCardPreview');
    html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `the-hocsinh-${name.replace(/\s+/g, '-')}.png`;
        link.click();
        showSuccessMessage('✅ Ảnh thẻ đã được tải xuống!');
    }).catch(err => {
        showErrorMessage('❌ Lỗi khi xuất ảnh: ' + err);
    });
}

// Print student card
function printStudentCard() {
    const cardElement = document.getElementById('studentCardPreview');
    const printWindow = window.open('', '', 'height=400, width=600');
    printWindow.document.write('<html><head><title>In Thẻ Học Sinh</title></head><body>');
    printWindow.document.write(cardElement.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Create student card
function createStudentCard() {
    const studentId = document.getElementById('studentSelect').value;
    if (!studentId) {
        showErrorMessage('Vui lòng chọn học sinh');
        return;
    }

    const student = allStudents.find(s => s.id === studentId);
    generateQrCard(student, 'student');
    document.getElementById('studentModal').style.display = 'none';
}

// Load teacher data to form
function loadTeacherToForm() {
    try {
        const teacherId = document.getElementById('teacherSelect').value;
        if (!teacherId) {
            clearTeacherForm();
            return;
        }

        const teacher = allTeachers.find(t => t.id === teacherId);
        if (teacher) {
            const nameEl = document.getElementById('teacherFormName');
            const idEl = document.getElementById('teacherFormID');
            const deptEl = document.getElementById('teacherFormDept');
            const phoneEl = document.getElementById('teacherFormPhone');
            const schoolEl = document.getElementById('teacherFormSchool');
            const imagePreview = document.getElementById('teacherFormImagePreview');
            
            if (nameEl) nameEl.value = teacher.name || '';
            if (idEl) idEl.value = teacher.id || '';
            if (deptEl) deptEl.value = teacher.subject || '';
            if (phoneEl) phoneEl.value = teacher.phone || '';
            if (schoolEl) schoolEl.value = schoolInfo.name || 'Trường PTDTBT THCS Hùng Lợi';
            
            if (teacher.image && imagePreview) {
                imagePreview.src = teacher.image;
                imagePreview.style.display = 'block';
            }
            
            // Trigger preview update
            setTimeout(() => {
                updateTeacherCardPreview();
            }, 100);
        }
    } catch (e) {
        console.error('Lỗi tải dữ liệu giáo viên:', e);
    }
}

// Preview teacher image
function previewTeacherImage(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = event.target.result;
            document.getElementById('teacherFormImagePreview').src = imageData;
            document.getElementById('teacherFormImagePreview').style.display = 'block';
            updateTeacherCardPreview();
        };
        reader.readAsDataURL(file);
    }
}

// Update teacher card preview
function updateTeacherCardPreview() {
    try {
        const nameEl = document.getElementById('teacherFormName');
        const idEl = document.getElementById('teacherFormID');
        const deptEl = document.getElementById('teacherFormDept');
        const phoneEl = document.getElementById('teacherFormPhone');
        const schoolEl = document.getElementById('teacherFormSchool');
        const imagePreview = document.getElementById('teacherFormImagePreview');
        const cardPhoto = document.getElementById('teacherCardPhoto');
        
        if (!nameEl || !idEl || !deptEl || !phoneEl || !schoolEl) {
            console.error('Các trường form không tìm thấy');
            return;
        }
        
        const name = nameEl.value.trim() || 'Nhập tên';
        const id = idEl.value.trim() || '----';
        const dept = deptEl.value.trim() || '----';
        const phone = phoneEl.value.trim() || '----';
        const school = schoolEl.value.trim() || 'Nhập tên trường';
        
        // Update photo
        if (cardPhoto && imagePreview && imagePreview.src) {
            const photoContainer = cardPhoto.parentElement;
            if (photoContainer) {
                photoContainer.innerHTML = '';
                const img = document.createElement('img');
                img.src = imagePreview.src;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                photoContainer.appendChild(img);
            }
        }
        
        // Update text
        const nameCard = document.getElementById('teacherCardName');
        const idCard = document.getElementById('teacherCardID');
        const deptCard = document.getElementById('teacherCardDept');
        const phoneCard = document.getElementById('teacherCardPhone');
        const schoolCard = document.getElementById('teacherCardSchool');
        
        if (nameCard) nameCard.textContent = truncateText(name, 12);
        if (idCard) idCard.textContent = id;
        if (deptCard) deptCard.textContent = dept;
        if (phoneCard) phoneCard.textContent = phone;
        if (schoolCard) schoolCard.textContent = school;
        
        // Generate QR Code
        try {
            const qrContainer = document.getElementById('teacherCardQR');
            if (qrContainer && id && id !== '----') {
                qrContainer.innerHTML = '';
                new QRCode(qrContainer, {
                    text: id,
                    width: 40,
                    height: 40,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        } catch (e) {
            console.log('Lỗi sinh QR code:', e);
        }
    } catch (e) {
        console.error('Lỗi cập nhật preview thẻ:', e);
    }
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

// Export teacher card as image
function exportTeacherCard() {
    const name = document.getElementById('teacherFormName').value;
    if (!name) {
        showErrorMessage('Vui lòng nhập tên giáo viên!');
        return;
    }
    
    const cardElement = document.getElementById('teacherCardPreview');
    html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `the-giaovien-${name.replace(/\s+/g, '-')}.png`;
        link.click();
        showSuccessMessage('✅ Ảnh thẻ đã được tải xuống!');
    }).catch(err => {
        showErrorMessage('❌ Lỗi khi xuất ảnh: ' + err);
    });
}

// Print teacher card
function printTeacherCard() {
    const name = document.getElementById('teacherFormName').value;
    if (!name) {
        showErrorMessage('Vui lòng nhập tên giáo viên!');
        return;
    }
    
    const cardElement = document.getElementById('teacherCardPreview');
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>In Thẻ</title></head><body>');
    printWindow.document.write(cardElement.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
}

// Clear teacher form
function clearTeacherForm() {
    const fields = ['teacherFormName', 'teacherFormID', 'teacherFormDept', 'teacherFormPhone', 'teacherFormSchool', 'teacherFormImage'];
    fields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    const imagePreview = document.getElementById('teacherFormImagePreview');
    if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    
    updateTeacherCardPreview();
}

// Create teacher card (QR - old function)
function createTeacherCard() {
    const teacherId = document.getElementById('teacherSelect').value;
    if (!teacherId) {
        showErrorMessage('Vui lòng chọn giáo viên');
        return;
    }

    const teacher = allTeachers.find(t => t.id === teacherId);
    generateQrCard(teacher, 'teacher');
}

// Generate QR card
function generateQrCard(person, type) {
    try {
        const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=' + encodeURIComponent(person.id);
        const cardTitle = type === 'student' ? 'THẺ HỌC SINH BẢN TRỪ 2025-2026' : 'THẺ GIÁO VIÊN 2025-2026';
        
        let personName = person.name || '';
        let personClass = person.class || '';
        let personRoom = person.room || '';
        let personId = person.id || '';
        let personSubject = person.subject || 'Không xác định';
        
        let infoHtml = '';
        if (type === 'student') {
            infoHtml = '<p><strong>Học sinh:</strong> ' + personName + '</p>';
            infoHtml += '<p><strong>Lớp:</strong> ' + personClass + '</p>';
            infoHtml += '<p><strong>Phòng:</strong> ' + personRoom + '</p>';
            infoHtml += '<p><strong>Mã:</strong> ' + personId + '</p>';
        } else {
            infoHtml = '<p><strong>Giáo viên:</strong> ' + personName + '</p>';
            infoHtml += '<p><strong>Chuyên môn:</strong> ' + personSubject + '</p>';
            infoHtml += '<p><strong>Phòng:</strong> ' + personRoom + '</p>';
            infoHtml += '<p><strong>Mã:</strong> ' + personId + '</p>';
        }

        let htmlContent = '<!DOCTYPE html>';
        htmlContent += '<html><head><meta charset="UTF-8">';
        htmlContent += '<style>';
        htmlContent += 'body { font-family: Arial, sans-serif; margin: 0; padding: 10px; background: #f0f0f0; }';
        htmlContent += '.card-container { width: 600px; margin: 20px auto; background: white; border: 3px solid #003D7A; border-radius: 15px; overflow: hidden; }';
        htmlContent += '.card-header { background-color: #003D7A; color: white; padding: 15px; text-align: center; }';
        htmlContent += '.card-header h2 { margin: 0; font-size: 16px; font-weight: bold; }';
        htmlContent += '.card-title { color: #FF0000; font-size: 18px; font-weight: bold; margin: 10px; padding: 10px; }';
        htmlContent += '.card-body { display: flex; padding: 25px; gap: 40px; }';
        htmlContent += '.card-info { flex: 1; font-size: 14px; }';
        htmlContent += '.card-info p { margin: 8px 0; color: #003D7A; }';
        htmlContent += '.card-info p strong { color: #000; }';
        htmlContent += '.card-qr { text-align: center; }';
        htmlContent += '.card-qr img { width: 280px; height: 280px; border: 2px solid #ddd; padding: 5px; background: white; }';
        htmlContent += '@media print { body { background: white; margin: 0; padding: 0; } }';
        htmlContent += '</style></head><body>';
        htmlContent += '<div class="card-container">';
        htmlContent += '<div class="card-header"><h2>TRƯỜNG PTDTBT THCS HÙNG LỢI</h2></div>';
        htmlContent += '<div class="card-title">' + cardTitle + '</div>';
        htmlContent += '<div class="card-body">';
        htmlContent += '<div class="card-info">' + infoHtml + '</div>';
        htmlContent += '<div class="card-qr"><img src="' + qrApiUrl + '" alt="QR Code" /></div>';
        htmlContent += '</div></div></body></html>';

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            setTimeout(function() {
                printWindow.print();
            }, 250);
        } else {
            showErrorMessage('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt popup!');
        }
    } catch(error) {
        console.error('Lỗi tạo thẻ:', error);
        showErrorMessage('Lỗi khi tạo thẻ: ' + error.message);
    }
}

// Show missing students
function showMissingStudents() {
    const attendedIds = new Set(attendanceRecords.map(r => r.id));
    const missing = allStudents.filter(s => !attendedIds.has(s.id));

    const tbody = document.getElementById('missingTableBody');
    tbody.innerHTML = '';

    if (missing.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Tất cả học sinh đều đã điểm danh!</td></tr>';
    } else {
        missing.forEach((student, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.room}</td>
            `;
            tbody.appendChild(row);
        });
    }

    document.getElementById('missingModal').style.display = 'block';
}

// Export as ZIP
async function exportCardsAsZip() {
    try {
        showSuccessMessage('Đang chuẩn bị xuất file... Vui lòng chờ.');
        
        const zip = new JSZip();
        const studentFolder = zip.folder('Thẻ_Học_Sinh');
        const teacherFolder = zip.folder('Thẻ_Giáo_Viên');
        
        // Helper function to convert canvas to blob promise
        const canvasToBlob = (canvas) => {
            return new Promise((resolve) => {
                canvas.toBlob(resolve);
            });
        };
        
        // Process students
        for (let i = 0; i < allStudents.length; i++) {
            const student = allStudents[i];
            
            // Fill form fields
            document.getElementById('studentFormName').value = student.name || '';
            document.getElementById('studentFormID').value = student.id || '';
            document.getElementById('studentFormClass').value = student.class || '';
            document.getElementById('studentFormRoom').value = student.room || '';
            document.getElementById('studentFormSchool').value = schoolInfo.name || 'Trường PTDTBT THCS Hùng Lợi';
            
            if (student.photo) {
                document.getElementById('studentFormImagePreview').src = student.photo;
                document.getElementById('studentFormImagePreview').style.display = 'block';
            }
            
            // Update preview
            updateStudentCardPreview();
            
            // Wait a moment for QR code to generate
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Capture card as image
            try {
                const cardElement = document.getElementById('studentCardPreview');
                const canvas = await html2canvas(cardElement, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true
                });
                
                // Convert to blob and add to zip
                const blob = await canvasToBlob(canvas);
                const fileName = `${student.id}_${student.name.replace(/\s+/g, '_')}.png`;
                studentFolder.file(fileName, blob);
            } catch (err) {
                console.error(`Lỗi xử lý học sinh ${student.id}:`, err);
            }
        }
        
        // Process teachers
        for (let i = 0; i < allTeachers.length; i++) {
            const teacher = allTeachers[i];
            
            // Fill form fields
            document.getElementById('teacherFormName').value = teacher.name || '';
            document.getElementById('teacherFormID').value = teacher.id || '';
            document.getElementById('teacherFormDept').value = teacher.subject || '';
            document.getElementById('teacherFormPhone').value = teacher.phone || '';
            document.getElementById('teacherFormSchool').value = schoolInfo.name || 'Trường PTDTBT THCS Hùng Lợi';
            
            if (teacher.image) {
                document.getElementById('teacherFormImagePreview').src = teacher.image;
                document.getElementById('teacherFormImagePreview').style.display = 'block';
            }
            
            // Update preview
            updateTeacherCardPreview();
            
            // Wait a moment for QR code to generate
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Capture card as image
            try {
                const cardElement = document.getElementById('teacherCardPreview');
                const canvas = await html2canvas(cardElement, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true
                });
                
                // Convert to blob and add to zip
                const blob = await canvasToBlob(canvas);
                const fileName = `${teacher.id}_${teacher.name.replace(/\s+/g, '_')}.png`;
                teacherFolder.file(fileName, blob);
            } catch (err) {
                console.error(`Lỗi xử lý giáo viên ${teacher.id}:`, err);
            }
        }
        
        // Generate and download zip
        const blob = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `the-hoc-sinh-giao-vien-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showSuccessMessage(`✅ Xuất file thành công! Đã lưu ${allStudents.length} thẻ học sinh và ${allTeachers.length} thẻ giáo viên.`);
        
        // Clear forms
        clearStudentForm();
        clearTeacherForm();
        
    } catch (error) {
        showErrorMessage('❌ Lỗi: ' + error.message);
        console.error('Export ZIP error:', error);
    }
}

// Show export ZIP modal
function showExportZipModal() {
    // Populate class filter
    const classFilterSelect = document.getElementById('classFilterSelect');
    const classSet = new Set(allStudents.map(s => s.class).filter(Boolean));
    classFilterSelect.innerHTML = '<option value="">-- Chọn lớp --</option>';
    Array.from(classSet).sort().forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = cls;
        classFilterSelect.appendChild(option);
    });

    // Populate room filter
    const roomFilterSelect = document.getElementById('roomFilterSelect');
    const roomSet = new Set(allStudents.map(s => s.room).filter(Boolean));
    roomFilterSelect.innerHTML = '<option value="">-- Chọn phòng --</option>';
    Array.from(roomSet).sort().forEach(room => {
        const option = document.createElement('option');
        option.value = room;
        option.textContent = room;
        roomFilterSelect.appendChild(option);
    });

    document.getElementById('exportZipModal').style.display = 'block';
}

// Export cards with filter options
async function exportCardsAsZipWithOptions() {
    try {
        const exportTeachers = document.getElementById('exportTeachers').checked;
        const exportStudents = document.getElementById('exportStudents').checked;
        
        if (!exportTeachers && !exportStudents) {
            showErrorMessage('Vui lòng chọn ít nhất một loại thẻ để xuất!');
            return;
        }

        // Get student filter options
        let studentFilter = 'all';
        let filterValue = null;
        if (exportStudents) {
            studentFilter = document.querySelector('input[name="studentFilter"]:checked').value;
            if (studentFilter === 'byClass') {
                filterValue = document.getElementById('classFilterSelect').value;
                if (!filterValue) {
                    showErrorMessage('Vui lòng chọn lớp để xuất!');
                    return;
                }
            } else if (studentFilter === 'byRoom') {
                filterValue = document.getElementById('roomFilterSelect').value;
                if (!filterValue) {
                    showErrorMessage('Vui lòng chọn phòng để xuất!');
                    return;
                }
            }
        }

        showSuccessMessage('Đang chuẩn bị xuất file... Vui lòng chờ.');
        document.getElementById('exportZipModal').style.display = 'none';
        
        const zip = new JSZip();
        let studentFolder = null;
        let teacherFolder = null;
        
        if (exportStudents) studentFolder = zip.folder('Thẻ_Học_Sinh');
        if (exportTeachers) teacherFolder = zip.folder('Thẻ_Giáo_Viên');
        
        // Helper function to convert canvas to blob promise
        const canvasToBlob = (canvas) => {
            return new Promise((resolve) => {
                canvas.toBlob(resolve);
            });
        };

        // Filter students based on options
        let studentsToExport = allStudents;
        if (exportStudents && studentFilter === 'byClass') {
            studentsToExport = allStudents.filter(s => s.class === filterValue);
        } else if (exportStudents && studentFilter === 'byRoom') {
            studentsToExport = allStudents.filter(s => s.room === filterValue);
        }
        
        // Process students
        if (exportStudents) {
            for (let i = 0; i < studentsToExport.length; i++) {
                const student = studentsToExport[i];
                
                // Fill form fields
                document.getElementById('studentFormName').value = student.name || '';
                document.getElementById('studentFormID').value = student.id || '';
                document.getElementById('studentFormClass').value = student.class || '';
                document.getElementById('studentFormRoom').value = student.room || '';
                document.getElementById('studentFormSchool').value = schoolInfo.name || 'Trường PTDTBT THCS Hùng Lợi';
                
                if (student.photo) {
                    document.getElementById('studentFormImagePreview').src = student.photo;
                    document.getElementById('studentFormImagePreview').style.display = 'block';
                }
                
                // Update preview
                updateStudentCardPreview();
                
                // Wait for QR code to fully render
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Capture card as image
                try {
                    const cardElement = document.getElementById('studentCardPreview');
                    const canvas = await html2canvas(cardElement, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        allowTaint: true
                    });
                    
                    // Convert to blob and add to zip
                    const blob = await canvasToBlob(canvas);
                    const fileName = `${student.id}_${student.name.replace(/\s+/g, '_')}.png`;
                    studentFolder.file(fileName, blob);
                } catch (err) {
                    console.error(`Lỗi xử lý học sinh ${student.id}:`, err);
                }
            }
        }
        
        // Process teachers
        if (exportTeachers) {
            for (let i = 0; i < allTeachers.length; i++) {
                const teacher = allTeachers[i];
                
                // Fill form fields
                document.getElementById('teacherFormName').value = teacher.name || '';
                document.getElementById('teacherFormID').value = teacher.id || '';
                document.getElementById('teacherFormDept').value = teacher.subject || '';
                document.getElementById('teacherFormPhone').value = teacher.phone || '';
                document.getElementById('teacherFormSchool').value = schoolInfo.name || 'Trường PTDTBT THCS Hùng Lợi';
                
                if (teacher.image) {
                    document.getElementById('teacherFormImagePreview').src = teacher.image;
                    document.getElementById('teacherFormImagePreview').style.display = 'block';
                }
                
                // Update preview
                updateTeacherCardPreview();
                
                // Wait for QR code to fully render
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Capture card as image
                try {
                    const cardElement = document.getElementById('teacherCardPreview');
                    const canvas = await html2canvas(cardElement, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        allowTaint: true
                    });
                    
                    // Convert to blob and add to zip
                    const blob = await canvasToBlob(canvas);
                    const fileName = `${teacher.id}_${teacher.name.replace(/\s+/g, '_')}.png`;
                    teacherFolder.file(fileName, blob);
                } catch (err) {
                    console.error(`Lỗi xử lý giáo viên ${teacher.id}:`, err);
                }
            }
        }
        
        // Generate and download zip
        const blob = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        let fileName = 'the-';
        if (exportStudents && exportTeachers) {
            fileName += `hoc-sinh-giao-vien-${new Date().toISOString().slice(0, 10)}.zip`;
        } else if (exportStudents) {
            if (studentFilter === 'byClass') {
                fileName += `hoc-sinh-lop-${filterValue}-${new Date().toISOString().slice(0, 10)}.zip`;
            } else if (studentFilter === 'byRoom') {
                fileName += `hoc-sinh-phong-${filterValue}-${new Date().toISOString().slice(0, 10)}.zip`;
            } else {
                fileName += `hoc-sinh-${new Date().toISOString().slice(0, 10)}.zip`;
            }
        } else {
            fileName += `giao-vien-${new Date().toISOString().slice(0, 10)}.zip`;
        }
        
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        let message = '✅ Xuất file thành công! ';
        if (exportStudents) {
            message += `Đã lưu ${studentsToExport.length} thẻ học sinh. `;
        }
        if (exportTeachers) {
            message += `Đã lưu ${allTeachers.length} thẻ giáo viên.`;
        }
        showSuccessMessage(message);
        
        // Clear forms
        clearStudentForm();
        clearTeacherForm();
        
    } catch (error) {
        showErrorMessage('❌ Lỗi: ' + error.message);
        console.error('Export ZIP error:', error);
    }
}

// Export attendance
function exportAttendance() {
    const csv = generateCsvContent();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `diem-danh-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Generate CSV content
function generateCsvContent() {
    let csv = 'STT,Mã QR,Loại,Tên,Phòng/Lớp,Buổi,Giờ điểm danh,Ngày\n';
    attendanceRecords.forEach((record, index) => {
        const sessionLabel = record.sessionLabel || 'N/A';
        csv += `${index + 1},"${record.id}","${record.type}","${record.name}","${record.room}","${sessionLabel}","${record.timestamp}","${record.date}"\n`;
    });
    return csv;
}

// Update attendance table
function updateAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    // Filter records by current session
    const filteredRecords = attendanceRecords.filter(r => r.session === selectedSession);

    if (filteredRecords.length === 0) {
        const totalText = attendanceRecords.length === 0 
            ? 'Chưa có dữ liệu điểm danh. Hãy quét mã QR để bắt đầu.' 
            : `Chưa có điểm danh buổi này. Tổng cộng: ${attendanceRecords.length} người`;
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #999;">${totalText}</td></tr>`;
    } else {
        filteredRecords.forEach((record, displayIndex) => {
            const actualIndex = attendanceRecords.indexOf(record);
            const row = document.createElement('tr');
            const sessionLabel = record.sessionLabel || 'N/A';
            row.innerHTML = `
                <td>${displayIndex + 1}</td>
                <td><strong>${record.id}</strong></td>
                <td><span class="status-badge status-present">${record.type}</span></td>
                <td>${record.name}</td>
                <td>${record.room}</td>
                <td><strong>${sessionLabel}</strong></td>
                <td>${record.timestamp}</td>
                <td><button class="btn-delete" onclick="deleteRecord(${actualIndex})">Xóa</button></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Delete record
function deleteRecord(index) {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
        attendanceRecords.splice(index, 1);
        saveAttendanceToLocalStorage();
        updateAttendanceTable();
        updateStatistics();
    }
}

// Update statistics
function updateStatistics() {
    const totalStudents = allStudents.length;
    
    // Filter attendance records by current session
    const sessionRecords = attendanceRecords.filter(r => r.session === selectedSession);
    const attended = sessionRecords.filter(r => r.type === 'Học sinh').length;
    const absent = totalStudents - attended;
    const percentage = totalStudents > 0 ? Math.round((attended / totalStudents) * 100) : 0;

    document.getElementById('totalCount').textContent = totalStudents;
    document.getElementById('presentCount').textContent = attended;
    document.getElementById('absentCount').textContent = absent;
    document.getElementById('percentage').textContent = `${percentage}%`;
}

// Local storage functions
function saveAttendanceToLocalStorage() {
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
}

function loadAttendanceFromLocalStorage() {
    const data = localStorage.getItem('attendanceRecords');
    if (data) {
        attendanceRecords = JSON.parse(data);
        updateAttendanceTable();
    }
}

// Show messages with auto-dismiss toast
function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showErrorMessage(message) {
    showToast(message, 'error');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    
    const icon = type === 'success' ? '✓' : '✗';
    const iconColor = type === 'success' ? '#00B050' : '#FF6B6B';
    
    toast.innerHTML = `
        <span class="toast-icon" style="color: ${iconColor}">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Clear all attendance data
function clearAllAttendance() {
    if (confirm('⚠️ Bạn có chắc chắn muốn xóa tất cả dữ liệu điểm danh?\n\nHành động này không thể hoàn tác!')) {
        attendanceRecords = [];
        saveAttendanceToLocalStorage();
        updateAttendanceTable();
        updateStatistics();
        showSuccessMessage('✅ Đã xóa tất cả dữ liệu điểm danh!');
    }
}

// Print attendance list
function printAttendanceList() {
    if (attendanceRecords.length === 0) {
        showErrorMessage('❌ Chưa có dữ liệu điểm danh để in!');
        return;
    }

    let htmlContent = '<!DOCTYPE html>';
    htmlContent += '<html><head><meta charset="UTF-8">';
    htmlContent += '<title>Danh Sách Điểm Danh</title>';
    htmlContent += '<style>';
    htmlContent += 'body { font-family: Arial, sans-serif; margin: 20px; }';
    htmlContent += 'h1 { text-align: center; color: #0078D4; }';
    htmlContent += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
    htmlContent += 'th { background: #0078D4; color: white; padding: 12px; text-align: left; }';
    htmlContent += 'td { padding: 10px; border-bottom: 1px solid #ddd; }';
    htmlContent += 'tr:hover { background: #f5f5f5; }';
    htmlContent += '.summary { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }';
    htmlContent += '.summary p { margin: 5px 0; }';
    htmlContent += '.summary strong { color: #0078D4; }';
    htmlContent += '@media print { body { margin: 0; } .summary { page-break-before: always; } }';
    htmlContent += '</style></head><body>';
    
    htmlContent += `<h1>DANH SÁCH ĐIỂM DANH BÁN TRỪ</h1>`;
    htmlContent += `<p style="text-align: center; color: #666;">Ngày: ${new Date().toLocaleDateString('vi-VN')} | Giờ in: ${new Date().toLocaleTimeString('vi-VN')}</p>`;
    
    htmlContent += '<table>';
    htmlContent += '<thead><tr><th>STT</th><th>Mã QR</th><th>Loại</th><th>Tên</th><th>Phòng/Lớp</th><th>Buổi</th><th>Giờ điểm danh</th></tr></thead>';
    htmlContent += '<tbody>';
    
    attendanceRecords.forEach((record, index) => {
        const sessionLabel = record.sessionLabel || 'N/A';
        htmlContent += `<tr>
            <td>${index + 1}</td>
            <td>${record.id}</td>
            <td>${record.type}</td>
            <td>${record.name}</td>
            <td>${record.room}</td>
            <td>${sessionLabel}</td>
            <td>${record.timestamp}</td>
        </tr>`;
    });
    
    htmlContent += '</tbody></table>';
    
    // Add summary
    const totalStudents = allStudents.length;
    const attended = attendanceRecords.filter(r => r.type === 'Học sinh').length;
    const teachers = attendanceRecords.filter(r => r.type === 'Giáo viên').length;
    const percentage = totalStudents > 0 ? Math.round((attended / totalStudents) * 100) : 0;
    
    htmlContent += '<div class="summary">';
    htmlContent += '<p><strong>Tổng học sinh:</strong> ' + totalStudents + '</p>';
    htmlContent += '<p><strong>Đã điểm danh:</strong> ' + attended + ' (' + percentage + '%)</p>';
    htmlContent += '<p><strong>Chưa điểm danh:</strong> ' + (totalStudents - attended) + '</p>';
    htmlContent += '<p><strong>Giáo viên đã điểm danh:</strong> ' + teachers + '</p>';
    htmlContent += '<p><strong>Tổng cộng:</strong> ' + attendanceRecords.length + ' người</p>';
    htmlContent += '</div>';
    
    htmlContent += '</body></html>';
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    } else {
        showErrorMessage('❌ Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt popup!');
    }
}

// Show statistics
function showStatistics() {
    const totalStudents = allStudents.length;
    const attended = attendanceRecords.filter(r => r.type === 'Học sinh').length;
    const absent = totalStudents - attended;
    const percentage = totalStudents > 0 ? Math.round((attended / totalStudents) * 100) : 0;
    const teachers = attendanceRecords.filter(r => r.type === 'Giáo viên').length;
    
    // Update statistics display
    document.getElementById('statTotalStudents').textContent = totalStudents;
    document.getElementById('statAttended').textContent = attended;
    document.getElementById('statAbsent').textContent = absent;
    document.getElementById('statPercentage').textContent = percentage + '%';
    document.getElementById('statTeachers').textContent = teachers;
    document.getElementById('statTotal').textContent = attendanceRecords.length;
    
    // Session statistics
    const sessionStats = {
        morning: attendanceRecords.filter(r => r.session === 'morning').length,
        afternoon: attendanceRecords.filter(r => r.session === 'afternoon').length,
        evening: attendanceRecords.filter(r => r.session === 'evening').length
    };
    
    const sessionStatsDiv = document.getElementById('sessionStats');
    sessionStatsDiv.innerHTML = `
        <div style="background: #FFF8DC; padding: 12px; border-radius: 8px; text-align: center; border-left: 4px solid #FFD700;">
            <div style="font-weight: bold; color: #FF8C00; font-size: 1.5em;">${sessionStats.morning}</div>
            <div style="color: #666; font-size: 0.9em;">Buổi Sáng</div>
        </div>
        <div style="background: #E0F4FF; padding: 12px; border-radius: 8px; text-align: center; border-left: 4px solid #4ECDC4;">
            <div style="font-weight: bold; color: #0078D4; font-size: 1.5em;">${sessionStats.afternoon}</div>
            <div style="color: #666; font-size: 0.9em;">Buổi Trưa</div>
        </div>
        <div style="background: #F0E6FF; padding: 12px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea;">
            <div style="font-weight: bold; color: #667eea; font-size: 1.5em;">${sessionStats.evening}</div>
            <div style="color: #666; font-size: 0.9em;">Buổi Tối</div>
        </div>
    `;
    
    document.getElementById('statisticsModal').style.display = 'block';
}
