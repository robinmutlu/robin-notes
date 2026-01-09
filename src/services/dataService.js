// IndexedDB Database Service for Robin Notes
// Provides persistent storage for courses, users, and files

const DB_NAME = 'robinnotes-db';
const DB_VERSION = 1;

let db = null;

// Initialize database
export function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Courses store
            if (!database.objectStoreNames.contains('courses')) {
                const coursesStore = database.createObjectStore('courses', { keyPath: 'id' });
                coursesStore.createIndex('authorId', 'authorId', { unique: false });
                coursesStore.createIndex('isPublic', 'isPublic', { unique: false });
            }

            // Users store
            if (!database.objectStoreNames.contains('users')) {
                const usersStore = database.createObjectStore('users', { keyPath: 'id' });
                usersStore.createIndex('email', 'email', { unique: true });
            }

            // Files store (for large files like videos)
            if (!database.objectStoreNames.contains('files')) {
                database.createObjectStore('files', { keyPath: 'id' });
            }
        };
    });
}

// Generic CRUD operations
async function getStore(storeName, mode = 'readonly') {
    const database = await initDB();
    const transaction = database.transaction(storeName, mode);
    return transaction.objectStore(storeName);
}

async function getAll(storeName) {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getById(storeName, id) {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function put(storeName, data) {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteById(storeName, id) {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getByIndex(storeName, indexName, value) {
    const store = await getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// File operations (no size limits - stored in IndexedDB)
export async function saveFile(file) {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const fileData = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result,
                createdAt: new Date().toISOString()
            };

            try {
                await put('files', fileData);
                resolve(fileId);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function getFile(fileId) {
    if (!fileId) return null;
    // If it's already a URL (http/https or data:), return as is
    if (typeof fileId === 'string' && (fileId.startsWith('http') || fileId.startsWith('data:'))) {
        return fileId;
    }

    try {
        const file = await getById('files', fileId);
        return file?.data || null;
    } catch {
        return null;
    }
}

export async function deleteFile(fileId) {
    if (!fileId || (typeof fileId === 'string' && fileId.startsWith('http'))) return;
    try {
        await deleteById('files', fileId);
    } catch (e) {
        console.warn('Could not delete file:', e);
    }
}

// Sample data for initial setup
const sampleCourses = [
    {
        id: '1',
        title: 'Web Geliştirme Temelleri',
        description: 'HTML, CSS ve JavaScript ile web geliştirmenin temellerini öğrenin.',
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
        category: 'Yazılım',
        authorId: '1',
        authorName: 'Admin',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        isPublic: true,
        contents: [
            {
                id: 'c1',
                type: 'note',
                title: 'HTML Giriş',
                order: 0,
                data: {
                    content: `# HTML Nedir?

HTML (HyperText Markup Language), web sayfalarının yapısını oluşturmak için kullanılan standart işaretleme dilidir.

## Temel Yapı

\`\`\`html
<!DOCTYPE html>
<html>
  <head>
    <title>Sayfa Başlığı</title>
  </head>
  <body>
    <h1>Merhaba Dünya!</h1>
    <p>Bu bir paragraftır.</p>
  </body>
</html>
\`\`\`

## Önemli Etiketler

- **\`<h1>\` - \`<h6>\`**: Başlıklar
- **\`<p>\`**: Paragraf
- **\`<a>\`**: Bağlantı
- **\`<img>\`**: Resim
- **\`<div>\`**: Bölüm`
                },
                createdAt: '2024-01-15T10:00:00Z'
            },
            {
                id: 'c2',
                type: 'flashcard',
                title: 'HTML Temel Kavramlar',
                order: 1,
                data: {
                    cards: [
                        { id: 'fc1', front: 'HTML ne anlama gelir?', back: 'HyperText Markup Language' },
                        { id: 'fc2', front: 'Hangi etiket ana başlık için kullanılır?', back: '<h1>' },
                        { id: 'fc3', front: 'Resim eklemek için hangi etiket kullanılır?', back: '<img>' },
                        { id: 'fc4', front: 'Bağlantı oluşturmak için hangi etiket kullanılır?', back: '<a>' },
                        { id: 'fc5', front: 'HTML dosyasının uzantısı nedir?', back: '.html veya .htm' }
                    ]
                },
                createdAt: '2024-01-15T11:00:00Z'
            },
            {
                id: 'c3',
                type: 'quiz',
                title: 'HTML Quiz',
                order: 2,
                data: {
                    questions: [
                        {
                            id: 'q1',
                            question: 'HTML bir programlama dili midir?',
                            options: ['Evet', 'Hayır', 'Belki', 'Bazen'],
                            correctAnswer: 1
                        },
                        {
                            id: 'q2',
                            question: 'Hangisi doğru bir HTML başlık etiketidir?',
                            options: ['<header>', '<heading>', '<h1>', '<title>'],
                            correctAnswer: 2
                        },
                        {
                            id: 'q3',
                            question: 'HTML belgesi hangi etiketle başlar?',
                            options: ['<html>', '<!DOCTYPE html>', '<head>', '<body>'],
                            correctAnswer: 1
                        }
                    ]
                },
                createdAt: '2024-01-15T12:00:00Z'
            },
            {
                id: 'c4',
                type: 'video',
                title: 'HTML Tanıtım Videosu',
                order: 3,
                data: {
                    url: 'https://www.youtube.com/embed/qz0aGYrrlhU',
                    duration: '12:34',
                    description: 'HTML\'e giriş videosu - temel kavramlar ve örnekler.'
                },
                createdAt: '2024-01-15T13:00:00Z'
            }
        ]
    },
    {
        id: '2',
        title: 'Matematik Temelleri',
        description: 'Temel matematik konularını ve problem çözme tekniklerini öğrenin.',
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop',
        category: 'Matematik',
        authorId: '1',
        authorName: 'Admin',
        createdAt: '2024-01-16T10:00:00Z',
        updatedAt: '2024-01-16T10:00:00Z',
        isPublic: true,
        contents: [
            {
                id: 'm1',
                type: 'note',
                title: 'Temel İşlemler',
                order: 0,
                data: {
                    content: `# Temel Matematik İşlemleri

## Dört İşlem

1. **Toplama (+)**: İki veya daha fazla sayıyı birleştirme
2. **Çıkarma (-)**: Bir sayıdan diğerini ayırma
3. **Çarpma (×)**: Tekrarlı toplama
4. **Bölme (÷)**: Eşit parçalara ayırma

## İşlem Önceliği

**PEMDAS** kuralı:
1. **P**arantez
2. **E**ksponensiyel (Üs)
3. **M**ultiplication & **D**ivision (Çarpma & Bölme)
4. **A**ddition & **S**ubtraction (Toplama & Çıkarma)`
                },
                createdAt: '2024-01-16T10:00:00Z'
            },
            {
                id: 'm2',
                type: 'flashcard',
                title: 'Çarpım Tablosu',
                order: 1,
                data: {
                    cards: [
                        { id: 'mfc1', front: '7 × 8 = ?', back: '56' },
                        { id: 'mfc2', front: '9 × 6 = ?', back: '54' },
                        { id: 'mfc3', front: '12 × 11 = ?', back: '132' },
                        { id: 'mfc4', front: '8 × 9 = ?', back: '72' },
                        { id: 'mfc5', front: '6 × 7 = ?', back: '42' }
                    ]
                },
                createdAt: '2024-01-16T11:00:00Z'
            }
        ]
    },
    {
        id: '3',
        title: 'İngilizce Gramer',
        description: 'İngilizce dilbilgisi kurallarını detaylı örneklerle öğrenin.',
        thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=250&fit=crop',
        category: 'Dil',
        authorId: '1',
        authorName: 'Admin',
        createdAt: '2024-01-17T10:00:00Z',
        updatedAt: '2024-01-17T10:00:00Z',
        isPublic: true,
        contents: [
            {
                id: 'e1',
                type: 'note',
                title: 'Simple Present Tense',
                order: 0,
                data: {
                    content: `# Simple Present Tense (Geniş Zaman)

## Kullanım Alanları

- **Alışkanlıklar**: I drink coffee every morning.
- **Genel gerçekler**: The sun rises in the east.
- **Programlar**: The train leaves at 8 AM.

## Yapı

### Olumlu Cümle
- I/You/We/They + V1
- He/She/It + V1 + s/es`
                },
                createdAt: '2024-01-17T10:00:00Z'
            },
            {
                id: 'e2',
                type: 'quiz',
                title: 'Present Tense Quiz',
                order: 1,
                data: {
                    questions: [
                        {
                            id: 'eq1',
                            question: 'She ___ to school every day.',
                            options: ['go', 'goes', 'going', 'gone'],
                            correctAnswer: 1
                        },
                        {
                            id: 'eq2',
                            question: 'They ___ football on Sundays.',
                            options: ['plays', 'play', 'playing', 'played'],
                            correctAnswer: 1
                        }
                    ]
                },
                createdAt: '2024-01-17T11:00:00Z'
            }
        ]
    }
];

// Initialize sample data
export async function initializeData() {
    try {
        await initDB();

        // Check if data already exists
        const existingCourses = await getAll('courses');
        if (existingCourses.length === 0) {
            // Add sample courses
            for (const course of sampleCourses) {
                await put('courses', course);
            }
        }

        const existingUsers = await getAll('users');
        if (existingUsers.length === 0) {
            // Add default admin
            const defaultAdmin = {
                id: '1',
                name: 'Admin',
                email: 'admin@robinnotes.com',
                password: 'admin123',
                role: 'admin',
                canUpload: true,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                createdAt: new Date().toISOString()
            };
            await put('users', defaultAdmin);
        }

        return true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return false;
    }
}

// Course operations
export async function getCourses() {
    try {
        return await getAll('courses');
    } catch {
        return [];
    }
}

export async function getPublicCourses() {
    const courses = await getCourses();
    return courses.filter(course => course.isPublic);
}

export async function getCoursesByAuthor(authorId) {
    try {
        return await getByIndex('courses', 'authorId', authorId);
    } catch {
        return [];
    }
}

export async function getCourseById(id) {
    try {
        return await getById('courses', id);
    } catch {
        return null;
    }
}

export async function createCourse(courseData, author) {
    const newCourse = {
        ...courseData,
        id: Date.now().toString(),
        authorId: author.id,
        authorName: author.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contents: []
    };
    await put('courses', newCourse);
    return newCourse;
}

export async function updateCourse(id, updates) {
    const course = await getCourseById(id);
    if (course) {
        const updatedCourse = {
            ...course,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await put('courses', updatedCourse);
        return updatedCourse;
    }
    return null;
}

export async function deleteCourse(id) {
    await deleteById('courses', id);
}

// Content operations
export async function addContent(courseId, contentData) {
    const course = await getCourseById(courseId);
    if (course) {
        const newContent = {
            ...contentData,
            id: Date.now().toString(),
            order: course.contents.length,
            createdAt: new Date().toISOString()
        };
        course.contents.push(newContent);
        course.updatedAt = new Date().toISOString();
        await put('courses', course);
        return newContent;
    }
    return null;
}

export async function updateContent(courseId, contentId, updates) {
    const course = await getCourseById(courseId);
    if (course) {
        const contentIndex = course.contents.findIndex(c => c.id === contentId);
        if (contentIndex !== -1) {
            course.contents[contentIndex] = {
                ...course.contents[contentIndex],
                ...updates
            };
            course.updatedAt = new Date().toISOString();
            await put('courses', course);
            return course.contents[contentIndex];
        }
    }
    return null;
}

export async function deleteContent(courseId, contentId) {
    const course = await getCourseById(courseId);
    if (course) {
        course.contents = course.contents.filter(c => c.id !== contentId);
        course.updatedAt = new Date().toISOString();
        await put('courses', course);
        return true;
    }
    return false;
}

export async function reorderContents(courseId, contentIds) {
    const course = await getCourseById(courseId);
    if (course) {
        // Create a map for quick lookup
        const contentMap = {};
        course.contents.forEach(c => { contentMap[c.id] = c; });

        // Reorder based on contentIds array
        course.contents = contentIds.map((id, index) => ({
            ...contentMap[id],
            order: index
        }));

        course.updatedAt = new Date().toISOString();
        await put('courses', course);
        return true;
    }
    return false;
}

// User operations
export async function getUsers() {
    try {
        const users = await getAll('users');
        return users.map(({ password, ...user }) => user);
    } catch {
        return [];
    }
}

export async function getUserById(userId) {
    try {
        const user = await getById('users', userId);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    } catch {
        return null;
    }
}

export async function getUserByEmail(email) {
    try {
        const users = await getAll('users');
        return users.find(u => u.email === email) || null;
    } catch {
        return null;
    }
}

export async function createUser(userData) {
    const users = await getAll('users');
    const isFirstUser = users.length === 0;

    const newUser = {
        ...userData,
        id: Date.now().toString(),
        role: isFirstUser ? 'admin' : 'user',
        canUpload: isFirstUser,
        avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        createdAt: new Date().toISOString()
    };

    await put('users', newUser);
    return newUser;
}

export async function updateUser(userId, updates) {
    const users = await getAll('users');
    const user = users.find(u => u.id === userId);
    if (user) {
        const updatedUser = { ...user, ...updates };
        await put('users', updatedUser);
        return updatedUser;
    }
    return null;
}

export async function deleteUser(userId) {
    await deleteById('users', userId);

    // Also delete user's courses
    const courses = await getCourses();
    for (const course of courses) {
        if (course.authorId === userId) {
            await deleteById('courses', course.id);
        }
    }
}

export async function updateUserRole(userId, role) {
    return updateUser(userId, { role });
}

export async function updateUserUploadPermission(userId, canUpload) {
    return updateUser(userId, { canUpload });
}

export async function updateUserAvatar(userId, avatarFileId) {
    return updateUser(userId, { avatar: avatarFileId });
}

// Statistics
export async function getStats() {
    const users = await getUsers();
    const courses = await getCourses();

    const totalContents = courses.reduce((sum, c) => sum + (c.contents?.length || 0), 0);

    const contentsByType = courses.reduce((acc, course) => {
        (course.contents || []).forEach(content => {
            acc[content.type] = (acc[content.type] || 0) + 1;
        });
        return acc;
    }, {});

    return {
        totalUsers: users.length,
        totalCourses: courses.length,
        totalContents,
        contentsByType,
        publicCourses: courses.filter(c => c.isPublic).length,
        privateCourses: courses.filter(c => !c.isPublic).length
    };
}
