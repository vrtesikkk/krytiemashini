// Рофельная игровая логика для Крутие Машыны

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.score = 0;
        this.speed = 0;
        this.maxSpeed = 200;
        
        // Игрок
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 100,
            width: 50,
            height: 80,
            speed: 5
        };
        
        // Машины на дороге
        this.cars = [];
        this.carImages = {
            lamborghini: null,
            mashina: null,
            mercedes: null,
            bugatti: null
        };
        
        // Другие изображения
        this.roadImage = null;
        this.explosionImage = null;
        
        // Взрыв
        this.explosion = {
            active: false,
            x: 0,
            y: 0,
            frame: 0,
            maxFrames: 20
        };
        
        // Звуки
        this.backgroundMusic = document.getElementById('backgroundMusic');
        this.explosionSound = document.getElementById('explosionSound');
        
        this.loadImages();
        this.setupEventListeners();
    }
    
    loadImages() {
        const imagePromises = [];
        
        // Загружаем изображения машин
        Object.keys(this.carImages).forEach(carType => {
            const img = new Image();
            img.src = `img/${carType}.png`;
            this.carImages[carType] = img;
            imagePromises.push(new Promise(resolve => {
                img.onload = resolve;
            }));
        });
        
        // Загружаем дорогу
        this.roadImage = new Image();
        this.roadImage.src = 'img/doroga.webp';
        imagePromises.push(new Promise(resolve => {
            this.roadImage.onload = resolve;
        }));
        
        // Загружаем взрыв
        this.explosionImage = new Image();
        this.explosionImage.src = 'img/explosion.png';
        imagePromises.push(new Promise(resolve => {
            this.explosionImage.onload = resolve;
        }));
        
        Promise.all(imagePromises).then(() => {
            console.log('Все изображения загружены!');
        });
    }
    
    setupEventListeners() {
        // Управление клавиатурой
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.movePlayer(-1);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.movePlayer(1);
                    break;
            }
        });
        
        // Управление мышью/тач
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameRunning) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            
            if (clickX < this.canvas.width / 2) {
                this.movePlayer(-1);
            } else {
                this.movePlayer(1);
            }
        });
        
        // Сенсорное управление для мобильных
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.gameRunning) return;
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            
            if (touchX < this.canvas.width / 2) {
                this.movePlayer(-1);
            } else {
                this.movePlayer(1);
            }
        });
        
        // Предотвращаем скролл при касании
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        // Мобильные кнопки управления
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        
        if (leftBtn && rightBtn) {
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.movePlayer(-1);
            });
            
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.movePlayer(1);
            });
            
            // Также работают по клику (для тестирования на десктопе)
            leftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.movePlayer(-1);
            });
            
            rightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.movePlayer(1);
            });
        }
    }
    
    movePlayer(direction) {
        this.player.x += direction * this.player.speed;
        
        // Ограничиваем движение в пределах дороги
        if (this.player.x < 50) this.player.x = 50;
        if (this.player.x > this.canvas.width - this.player.width - 50) {
            this.player.x = this.canvas.width - this.player.width - 50;
        }
    }
    
    spawnCar() {
        const carTypes = Object.keys(this.carImages);
        const randomCar = carTypes[Math.floor(Math.random() * carTypes.length)];
        
        // Случайная позиция по всей ширине дороги
        const carX = Math.random() * (this.canvas.width - 100) + 50;
        
        // Разные характеристики для разных машин
        let carSpeed, carWidth, carHeight;
        switch(randomCar) {
            case 'mercedes':
                carSpeed = 1.5 + Math.random() * 1; // Медленная
                carWidth = 45;
                carHeight = 75;
                break;
            case 'bugatti':
                carSpeed = 3 + Math.random() * 2; // Быстрая
                carWidth = 55;
                carHeight = 85;
                break;
            case 'mashina':
                carSpeed = 2 + Math.random() * 1.5; // Средняя
                carWidth = 50;
                carHeight = 80;
                break;
            default:
                carSpeed = 2 + Math.random() * 1.5;
                carWidth = 50;
                carHeight = 80;
        }
        
        const car = {
            x: carX - carWidth / 2,
            y: -100,
            width: carWidth,
            height: carHeight,
            type: randomCar,
            speed: carSpeed
        };
        
        this.cars.push(car);
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Обновляем скорость и счет
        this.speed = Math.min(this.speed + 0.1, this.maxSpeed);
        this.score += Math.floor(this.speed / 10);
        
        // Спавним машины с более разумной частотой
        const baseSpawnRate = 0.008; // Базовый шанс спавна
        const speedMultiplier = Math.min(this.speed / 5000, 0.01); // Максимальный бонус от скорости
        const spawnChance = baseSpawnRate + speedMultiplier;
        
        if (Math.random() < spawnChance) {
            this.spawnCar();
        }
        
        // Обновляем позиции машин
        this.cars.forEach(car => {
            car.y += car.speed + this.speed / 50;
        });
        
        // Удаляем машины, которые уехали за экран
        this.cars = this.cars.filter(car => car.y < this.canvas.height + 100);
        
        // Проверяем столкновения
        this.checkCollisions();
        
        // Обновляем взрыв
        if (this.explosion.active) {
            this.explosion.frame++;
            if (this.explosion.frame >= this.explosion.maxFrames) {
                this.explosion.active = false;
            }
        }
        
        // Обновляем UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('speed').textContent = Math.floor(this.speed);
    }
    
    checkCollisions() {
        this.cars.forEach(car => {
            if (this.isColliding(this.player, car)) {
                // Запускаем взрыв в позиции столкновения
                this.explosion.active = true;
                this.explosion.x = this.player.x + this.player.width / 2;
                this.explosion.y = this.player.y + this.player.height / 2;
                this.explosion.frame = 0;
                
                this.gameOver();
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    drawRoadMarkings() {
        // Простая разметка дороги - только центральная линия
        this.ctx.save();
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([15, 15]); // Пунктирная линия
        
        // Центральная линия дороги
        const centerX = this.canvas.width / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, this.canvas.height);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    draw() {
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем дорогу
        if (this.roadImage.complete) {
            this.ctx.drawImage(this.roadImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Простая дорога, если изображение не загружено
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Простая разметка дороги
        this.drawRoadMarkings();
        
        // Рисуем машины на дороге
        this.cars.forEach(car => {
            const img = this.carImages[car.type];
            if (img && img.complete) {
                this.ctx.save();
                this.ctx.translate(car.x + car.width / 2, car.y + car.height / 2);
                
                // Поворачиваем машины согласно требованиям
                if (car.type === 'mercedes') {
                    this.ctx.rotate(45 * Math.PI / 180);
                } else if (car.type === 'bugatti') {
                    this.ctx.rotate(-45 * Math.PI / 180);
                }
                
                this.ctx.drawImage(img, -car.width / 2, -car.height / 2, car.width, car.height);
                this.ctx.restore();
            } else {
                // Простые прямоугольники, если изображения не загружены
                this.ctx.fillStyle = car.type === 'mercedes' ? '#ff0000' : 
                                   car.type === 'bugatti' ? '#0000ff' : '#00ff00';
                this.ctx.fillRect(car.x, car.y, car.width, car.height);
            }
        });
        
        // Убираем подсветку полос
        
        // Рисуем игрока (Lamborghini) только если нет взрыва
        if (!this.explosion.active) {
            const playerImg = this.carImages.lamborghini;
            if (playerImg && playerImg.complete) {
                this.ctx.drawImage(playerImg, this.player.x, this.player.y, this.player.width, this.player.height);
            } else {
                // Простой прямоугольник для игрока
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
        
        // Рисуем взрыв
        if (this.explosion.active && this.explosionImage && this.explosionImage.complete) {
            this.ctx.save();
            this.ctx.globalAlpha = 1 - (this.explosion.frame / this.explosion.maxFrames);
            
            const explosionSize = 100 + (this.explosion.frame * 5);
            this.ctx.drawImage(
                this.explosionImage,
                this.explosion.x - explosionSize / 2,
                this.explosion.y - explosionSize / 2,
                explosionSize,
                explosionSize
            );
            this.ctx.restore();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Останавливаем музыку
        this.backgroundMusic.pause();
        
        // Воспроизводим звук взрыва
        this.explosionSound.play().catch(e => console.log('Не удалось воспроизвести звук взрыва'));
        
        // Показываем экран окончания игры через задержку (чтобы взрыв успел проиграться)
        setTimeout(() => {
            this.showGameOverScreen();
        }, 1500);
    }
    
    showGameOverScreen() {
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    start() {
        this.gameRunning = true;
        this.score = 0;
        this.speed = 0;
        this.cars = [];
        this.player.x = this.canvas.width / 2 - 25;
        
        // Запускаем музыку только если она была включена пользователем
        if (musicEnabled) {
            this.backgroundMusic.play().catch(e => console.log('Не удалось воспроизвести фоновую музыку'));
        }
        
        this.gameLoop();
    }
}

// Глобальные функции для управления экранами
let game;

function playVideo() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('videoScreen').classList.remove('hidden');
    
    const video = document.getElementById('ussrVideo');
    video.currentTime = 0;
    video.play();
}

function backToMenu() {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Показываем главное меню
    document.getElementById('mainMenu').classList.remove('hidden');
    
    // Останавливаем музыку
    const backgroundMusic = document.getElementById('backgroundMusic');
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

function startGame() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('videoScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    
    if (!game) {
        game = new Game();
    }
    
    game.start();
}

// Глобальная переменная для отслеживания музыки
let musicEnabled = false;

// Функция для включения музыки
function enableMusic() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const musicBtn = document.getElementById('musicBtn');
    
    console.log('Попытка включить музыку...');
    console.log('Состояние музыки:', backgroundMusic.readyState);
    console.log('Источник музыки:', backgroundMusic.src);
    console.log('Ошибка музыки:', backgroundMusic.error);
    
    if (!musicEnabled) {
        // Включаем музыку
        backgroundMusic.play().then(() => {
            musicEnabled = true;
            musicBtn.textContent = '🔇 ВЫКЛЮЧИТЬ МУЗЫКУ';
            musicBtn.classList.add('music-enabled');
            console.log('Музыка включена!');
        }).catch(e => {
            console.log('Не удалось включить музыку:', e);
            console.log('Код ошибки:', e.code);
            console.log('Сообщение ошибки:', e.message);
            alert('Не удалось включить музыку. Проверь, что файл ogonek.mp3 находится в папке проекта.\n\nОшибка: ' + e.message);
        });
    } else {
        // Выключаем музыку
        backgroundMusic.pause();
        musicEnabled = false;
        musicBtn.textContent = '🎵 ВКЛЮЧИТЬ МУЗЫКУ';
        musicBtn.classList.remove('music-enabled');
        console.log('Музыка выключена!');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Крутие Машыны загружены! Готов к рофелю!');
    
    // Предзагружаем звуки
    const backgroundMusic = document.getElementById('backgroundMusic');
    const explosionSound = document.getElementById('explosionSound');
    
    // Настраиваем громкость
    backgroundMusic.volume = 0.3;
    explosionSound.volume = 0.7;
    
    // Проверяем, загружен ли файл музыки
    backgroundMusic.addEventListener('error', (e) => {
        console.log('Ошибка загрузки музыки:', e);
        console.log('Файл ogonek.mp3 не найден! Добавь его в папку проекта.');
        const musicBtn = document.getElementById('musicBtn');
        musicBtn.textContent = '❌ ФАЙЛ НЕ НАЙДЕН';
        musicBtn.disabled = true;
    });
    
    // Проверяем, когда файл загрузится
    backgroundMusic.addEventListener('canplaythrough', () => {
        console.log('Музыка загружена и готова к воспроизведению!');
    });
    
    // Проверяем готовность файла
    backgroundMusic.addEventListener('loadeddata', () => {
        console.log('Данные музыки загружены!');
    });
});
