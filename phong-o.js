document.addEventListener('DOMContentLoaded', () => {
    // Check if localStorage is available
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
    } catch (e) {
        alert('LocalStorage không khả dụng. Vui lòng mở file qua HTTP server (ví dụ: python -m http.server) thay vì file:// để các chức năng lưu trữ hoạt động.');
        return;
    }

    // BroadcastChannel for real-time updates
    const channel = new BroadcastChannel('schoolDataUpdates');
    const teacherSelect = document.getElementById('teacherName');
    const teacherImage = document.getElementById('teacherImage');
    let teachers = []; // Global teachers array
    let rooms = []; // Global rooms array

    // Load rooms from localStorage first
    rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
    if (rooms.length === 0) {
        // Add default rooms if none exist
        rooms = [
            { 
                roomName: 'A101', 
                teacherName: 'Nguyễn Thị Hà', 
                teacherEmail: 'ha.nguyen@school.edu.vn',
                currentCount: 12, 
                teacherPhone: '987013380', 
                teacherImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HaeG7h3Rh7JuZyBwaOG7qW5nPC90ZXh0Pgo8L3N2Zz4K'
            },
            { 
                roomName: 'A102', 
                teacherName: 'Lê Thị Hường', 
                teacherEmail: 'huong.le@school.edu.vn',
                currentCount: 12, 
                teacherPhone: '975605814', 
                teacherImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HaeG7h3Rh7JuZyBwaOG7qW5nPC90ZXh0Pgo8L3N2Zz4K'
            }
        ];
        localStorage.setItem('rooms', JSON.stringify(rooms));
    }

    channel.onmessage = function(event) {
        if (event.data.type === 'teacherUpdated') {
            loadTeachersAndUpdateUI();
        }
    };

    loadTeachersAndUpdateUI();

    function loadTeachersAndUpdateUI() {
        // Load teachers from shared localStorage
        let teachers = JSON.parse(localStorage.getItem('teachers')) || [];
        if (teachers.length === 0) {
            // Fallback default teachers
            teachers = [
                { id: 'GV001', name: 'Nguyễn Thị Hà', department: 'Toán', phone: '987013380', email: 'ha.nguyen@school.edu.vn' },
                { id: 'GV002', name: 'Lê Thị Hường', department: 'Văn', phone: '975605814', email: 'huong.le@school.edu.vn' },
                { id: 'GV003', name: 'Nguyễn Văn Bằng', department: 'Anh', phone: '0912345678', email: 'bang.nguyen@school.edu.vn' }
            ];
            localStorage.setItem('teachers', JSON.stringify(teachers));
        }
            localStorage.setItem('teachers', JSON.stringify(teachers));
        }

        // Update select options
        teacherSelect.innerHTML = '<option value="">-- Chọn giáo viên --</option>';
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = JSON.stringify({ 
                name: teacher.name, 
                image: teacher.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HaeG7h3Rh7JuZyBwaOG7qW5nPC90ZXh0Pgo8L3N2Zz4K',
                phone: teacher.phone,
                email: teacher.email || `${teacher.name.toLowerCase().replace(/\s+/g, '.')}@school.edu.vn`
            });
            option.textContent = teacher.name;
            teacherSelect.appendChild(option);
        });

        // Update table if rooms exist
        updateTable();
    }

    teacherSelect.addEventListener('change', (e) => {
        const selected = JSON.parse(e.target.value || '{}');
        teacherImage.src = selected.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HaeG7h3Rh7JuZyBwaOG7qW5nPC90ZXh0Pgo8L3N2Zz4K';
        // Reset file input when changing teacher
        document.getElementById('teacherImageInput').value = '';
    });

    // Handle image upload
    document.getElementById('teacherImageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                teacherImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    updateTable();

    document.getElementById('addRoomBtn').addEventListener('click', () => {
        document.getElementById('roomName').value = '';
        document.getElementById('teacherName').value = '';
        document.getElementById('teacherID').value = '';
        document.getElementById('department').value = '';
        document.getElementById('teacherEmail').value = '';
        document.getElementById('currentCount').value = 0;
        document.getElementById('teacherPhone').value = '';
        document.getElementById('teacherImageInput').value = '';
        teacherImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HaeG7h3Rh7JuZyBwaOG7qW5nPC90ZXh0Pgo8L3N2Zz4K';
    });

    document.getElementById('saveRoomBtn').addEventListener('click', () => {
        const roomName = document.getElementById('roomName').value.trim();
        const teacherData = JSON.parse(document.getElementById('teacherName').value || '{}');
        const teacherName = teacherData.name || '';
        const teacherID = document.getElementById('teacherID').value.trim();
        const department = document.getElementById('department').value.trim();
        const teacherEmail = document.getElementById('teacherEmail').value.trim();
        const currentCount = document.getElementById('currentCount').value;
        const teacherPhone = document.getElementById('teacherPhone').value.trim();
        const teacherImageSrc = teacherImage.src;

        if (!roomName || !teacherName) {
            alert('Vui lòng nhập tên phòng và chọn giáo viên.');
            return;
        }

        const newRoom = { 
            roomName, 
            teacherName, 
            teacherID,
            department,
            teacherEmail, 
            currentCount, 
            teacherPhone, 
            teacherImage: teacherImageSrc, 
            students: [] 
        };
        rooms.push(newRoom);
        localStorage.setItem('rooms', JSON.stringify(rooms));
        updateTable();
        alert('Phòng đã được lưu.');
    });

    document.getElementById('deleteRoomBtn').addEventListener('click', () => {
        const roomName = document.getElementById('roomName').value.trim();
        if (!roomName) {
            alert('Vui lòng nhập tên phòng để xóa.');
            return;
        }
        rooms = rooms.filter(room => room.roomName !== roomName);
        localStorage.setItem('rooms', JSON.stringify(rooms));
        updateTable();
        alert('Phòng đã được xóa.');
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        const roomName = document.getElementById('roomName').value.trim();
        if (!roomName) {
            alert('Vui lòng nhập tên phòng để cập nhật!');
            return;
        }

        // Tìm phòng trong danh sách
        const roomIndex = rooms.findIndex(room => room.roomName === roomName);
        if (roomIndex === -1) {
            alert('Không tìm thấy phòng với tên này!');
            return;
        }

        // Lấy thông tin từ form
        const teacherSelect = document.getElementById('teacherName');
        const selectedTeacher = teacherSelect.value ? JSON.parse(teacherSelect.value) : null;

        // Cập nhật thông tin phòng
        rooms[roomIndex].teacherName = selectedTeacher ? selectedTeacher.name : '';
        rooms[roomIndex].teacherID = document.getElementById('teacherID').value.trim();
        rooms[roomIndex].department = document.getElementById('department').value.trim();
        rooms[roomIndex].teacherEmail = document.getElementById('teacherEmail').value.trim();
        rooms[roomIndex].currentCount = parseInt(document.getElementById('currentCount').value) || 0;
        rooms[roomIndex].teacherPhone = document.getElementById('teacherPhone').value.trim();
        rooms[roomIndex].teacherImage = teacherImage.src;

        // Lưu vào localStorage
        localStorage.setItem('rooms', JSON.stringify(rooms));

        // Cập nhật bảng hiển thị
        updateTable();

        // Thông báo thành công
        alert('Cập nhật thông tin phòng thành công!');
    });

    document.getElementById('importBtn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
                        
                        // Convert to room format
                        const importedRooms = jsonData.map(row => ({
                            roomName: row['Tên phòng'] || '',
                            teacherName: row['Giáo viên phụ trách'] || '',
                            currentCount: row['Sĩ số'] || 0,
                            teacherPhone: row['SDT'] || '',
                            teacherImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HaeG7h3Rh7JuZyBwaOG7qW5nPC90ZXh0Pgo8L3N2Zz4K', // Default image
                            students: [] // Initialize empty students array
                        })).filter(room => room.roomName && room.teacherName);
                        
                        if (importedRooms.length === 0) {
                            alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
                            return;
                        }
                        
                        // Merge with existing rooms, avoid duplicates by roomName
                        const existingNames = new Set(rooms.map(r => r.roomName));
                        const newRooms = importedRooms.filter(r => !existingNames.has(r.roomName));
                        rooms = rooms.concat(newRooms);
                        
                        localStorage.setItem('rooms', JSON.stringify(rooms));
                        updateTable();
                        alert(`Đã import ${newRooms.length} phòng mới.`);
                    } catch (error) {
                        alert('Lỗi khi đọc file Excel: ' + error.message);
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        };
        input.click();
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
        if (rooms.length === 0) {
            alert('Không có dữ liệu để xuất.');
            return;
        }
        const ws = XLSX.utils.json_to_sheet(rooms.map(room => ({
            'Tên phòng': room.roomName,
            'Giáo viên phụ trách': room.teacherName,
            'Sĩ số': room.currentCount,
            'SDT': room.teacherPhone
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Danh sách phòng');
        XLSX.writeFile(wb, 'danh-sach-phong.xlsx');
        alert('Đã xuất file Excel.');
    });

    function updateTable() {
        const tbody = document.getElementById('roomTableBody');
        tbody.innerHTML = '';
        rooms.forEach((room, index) => {
            const row = document.createElement('tr');
            
            const sttCell = document.createElement('td');
            sttCell.textContent = index + 1;
            
            const roomCell = document.createElement('td');
            roomCell.textContent = room.roomName;
            
            const teacherCell = document.createElement('td');
            teacherCell.textContent = room.teacherName;
            teacherCell.style.cursor = 'pointer';
            teacherCell.style.color = '#007bff';
            teacherCell.style.userSelect = 'none'; // Prevent text selection
            teacherCell.classList.add('teacher-cell'); // Add class for event delegation
            teacherCell.onclick = (e) => {
                e.stopPropagation();
                showTeacherModal(room.teacherName);
            };
            
            const countCell = document.createElement('td');
            countCell.textContent = room.currentCount;
            
            const phoneCell = document.createElement('td');
            phoneCell.textContent = room.teacherPhone;
            
            const actionCell = document.createElement('td');
            const viewBtn = document.createElement('button');
            viewBtn.type = 'button';
            viewBtn.textContent = 'XEM HS';
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showStudentModal(room);
            });
            actionCell.appendChild(viewBtn);
            
            row.appendChild(sttCell);
            row.appendChild(roomCell);
            row.appendChild(teacherCell);
            row.appendChild(countCell);
            row.appendChild(phoneCell);
            row.appendChild(actionCell);
            
            row.addEventListener('click', () => loadRoom(room));
            tbody.appendChild(row);
        });
    }

    function loadTeacherInfo(teacherName) {
        const teacher = teachers.find(t => t.name === teacherName);
        if (teacher) {
            // Set select to this teacher
            const teacherSelect = document.getElementById('teacherName');
            for (let i = 0; i < teacherSelect.options.length; i++) {
                const option = teacherSelect.options[i];
                if (option.value) {
                    const data = JSON.parse(option.value);
                    if (data.name === teacherName) {
                        teacherSelect.selectedIndex = i;
                        break;
                    }
                }
            }
            // Load info into form
            document.getElementById('teacherEmail').value = teacher.email || `${teacher.name.toLowerCase().replace(/\s+/g, '.')}@school.edu.vn`;
            document.getElementById('teacherPhone').value = teacher.phone || '';
            teacherImage.src = teacher.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HaeG7h3Rh7JuZyBwaOG7qW5nPC90ZXh0Pgo8L3N2Zz4K';
            // Reset file input
            document.getElementById('teacherImageInput').value = '';
        }
    }

    function showTeacherModal(teacherName) {
        const teacher = teachers.find(t => t.name === teacherName);
        if (teacher) {
            // Store current teacher for editing
            window.currentTeacher = teacher;
            
            document.getElementById('teacherModalImage').src = teacher.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HaeG7h3Rh7JuZyBwaOG7qW5nPC90ZXh0Pgo8L3N2Zz4K';
            document.getElementById('teacherModalName').textContent = teacher.name;
            document.getElementById('teacherModalPhone').textContent = teacher.phone || 'Chưa cập nhật';
            document.getElementById('teacherModalEmail').textContent = teacher.email || `${teacher.name.toLowerCase().replace(/\s+/g, '.')}@school.edu.vn`;
            
            // Reset to view mode
            exitEditMode();
            
            document.getElementById('teacherModal').style.display = 'block';
        }
    }

    function enterEditMode() {
        const modal = document.getElementById('teacherModal');
        modal.classList.add('edit-mode');
        
        // Replace text with inputs
        const nameElement = document.getElementById('teacherModalName');
        const phoneElement = document.getElementById('teacherModalPhone');
        const emailElement = document.getElementById('teacherModalEmail');
        
        nameElement.innerHTML = `<input type="text" id="editName" value="${window.currentTeacher.name}">`;
        phoneElement.innerHTML = `<input type="text" id="editPhone" value="${window.currentTeacher.phone || ''}">`;
        emailElement.innerHTML = `<input type="email" id="editEmail" value="${window.currentTeacher.email || ''}">`;
        
        // Show save/cancel buttons, hide edit button
        document.getElementById('btnEdit').style.display = 'none';
        document.getElementById('btnSave').style.display = 'inline-block';
        document.getElementById('btnCancel').style.display = 'inline-block';
    }

    function exitEditMode() {
        const modal = document.getElementById('teacherModal');
        modal.classList.remove('edit-mode');
        
        // Restore original display
        document.getElementById('teacherModalName').textContent = window.currentTeacher.name;
        document.getElementById('teacherModalPhone').textContent = window.currentTeacher.phone || 'Chưa cập nhật';
        document.getElementById('teacherModalEmail').textContent = window.currentTeacher.email || `${window.currentTeacher.name.toLowerCase().replace(/\s+/g, '.')}@school.edu.vn`;
        
        // Show edit button, hide save/cancel buttons
        document.getElementById('btnEdit').style.display = 'inline-block';
        document.getElementById('btnSave').style.display = 'none';
        document.getElementById('btnCancel').style.display = 'none';
    }

    function saveTeacherChanges() {
        const newName = document.getElementById('editName').value.trim();
        const newPhone = document.getElementById('editPhone').value.trim();
        const newEmail = document.getElementById('editEmail').value.trim();
        
        if (!newName) {
            alert('Tên giáo viên không được để trống!');
            return;
        }
        
        // Update teacher data
        const teacherIndex = teachers.findIndex(t => t.id === window.currentTeacher.id);
        if (teacherIndex !== -1) {
            teachers[teacherIndex].name = newName;
            teachers[teacherIndex].phone = newPhone;
            teachers[teacherIndex].email = newEmail;
            
            // Save to localStorage
            localStorage.setItem('teachers', JSON.stringify(teachers));
            
            // Update current teacher reference
            window.currentTeacher = teachers[teacherIndex];
            
            // Notify other pages
            channel.postMessage({ type: 'teacherUpdated' });
            
            // Update rooms that reference this teacher
            rooms.forEach(room => {
                if (room.teacherName === window.currentTeacher.name) {
                    room.teacherName = newName;
                    room.teacherPhone = newPhone;
                    room.teacherEmail = newEmail;
                }
            });
            localStorage.setItem('rooms', JSON.stringify(rooms));
            
            // Refresh UI
            loadTeachersAndUpdateUI();
            updateTable();
            
            // Exit edit mode
            exitEditMode();
            
            alert('Cập nhật thông tin giáo viên thành công!');
        }
    }

    function showStudentModal(room) {
        const modal = document.getElementById('studentModal');
        const title = document.getElementById('modalTitle');
        const tbody = document.getElementById('studentTableBody');
        
        title.textContent = `Danh sách học sinh - Phòng ${room.roomName}`;
        tbody.innerHTML = '';
        
        // Lấy dữ liệu học sinh từ file quản lý học sinh
        const allStudents = JSON.parse(localStorage.getItem('students')) || [];
        
        // Lọc học sinh theo phòng
        const roomStudents = allStudents.filter(student => student.room === room.roomName);
        
        if (roomStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Không có học sinh nào trong phòng này.</td></tr>';
        } else {
            roomStudents.forEach((student, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    <td>${student.sClass}</td>
                    <td>${student.gender}</td>
                    <td>${student.dob}</td>
                `;
                tbody.appendChild(row);
            });
        }
        
        modal.style.display = 'block';
    }

    function loadRoom(room) {
        document.getElementById('roomName').value = room.roomName;
        // Set teacher select to match
        const teacherSelect = document.getElementById('teacherName');
        for (let i = 0; i < teacherSelect.options.length; i++) {
            const option = teacherSelect.options[i];
            if (option.value) {
                const data = JSON.parse(option.value);
                if (data.name === room.teacherName) {
                    teacherSelect.selectedIndex = i;
                    break;
                }
            }
        }
        document.getElementById('teacherEmail').value = room.teacherEmail || '';
        document.getElementById('currentCount').value = room.currentCount;
        document.getElementById('teacherPhone').value = room.teacherPhone;
        teacherImage.src = room.teacherImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HaeG7h3Rh7JuZyBwaOG7qW5nPC90ZXh0Pgo8L3N2Zz4K';
        // Reset file input
        document.getElementById('teacherImageInput').value = '';
    }

    // Event delegation for teacher cells
    document.getElementById('roomTableBody').addEventListener('click', (e) => {
        let target = e.target;
        if (target.classList.contains('teacher-cell') || target.parentElement.classList.contains('teacher-cell')) {
            e.stopPropagation();
            const teacherName = target.classList.contains('teacher-cell') ? target.textContent : target.parentElement.textContent;
            showTeacherModal(teacherName);
        }
    });

    // Modal close events
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('studentModal').style.display = 'none';
    });

    document.querySelector('.close-teacher').addEventListener('click', () => {
        document.getElementById('teacherModal').style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        const studentModal = document.getElementById('studentModal');
        const teacherModal = document.getElementById('teacherModal');
        if (event.target === studentModal) {
            studentModal.style.display = 'none';
        }
        if (event.target === teacherModal) {
            teacherModal.style.display = 'none';
        }
    });

    // Teacher modal edit functionality
    document.getElementById('btnEdit').addEventListener('click', enterEditMode);
    document.getElementById('btnSave').addEventListener('click', saveTeacherChanges);
    document.getElementById('btnCancel').addEventListener('click', exitEditMode);
});
