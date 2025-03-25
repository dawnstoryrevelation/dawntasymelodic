<template>
    <div class="senticon-container">
      <div class="senticon" :class="[mood, { animating: isAnimating }]">
        <!-- Face components -->
        <div class="senticon-face">
          <!-- Head shape -->
          <div class="head">
            <!-- Eyes -->
            <div class="eyes">
              <div class="eye left-eye">
                <div class="pupil"></div>
                <div class="highlight"></div>
              </div>
              <div class="eye right-eye">
                <div class="pupil"></div>
                <div class="highlight"></div>
              </div>
            </div>
            <!-- Mouth -->
            <div class="mouth" :class="mouthType"></div>
          </div>
        </div>
        
        <!-- Mood indicator ring -->
        <div class="mood-ring" :class="mood"></div>
        
        <!-- Status text (optional) -->
        <div v-if="showStatus" class="status-text">{{ statusText }}</div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Senticon',
    props: {
      mood: {
        type: String,
        default: 'neutral',
        validator: (value) => {
          return ['neutral', 'thinking', 'happy', 'excited', 'surprised', 
                  'empathetic', 'sad', 'confused', 'laughing'].includes(value);
        }
      },
      isStreaming: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        isAnimating: true,
        isBlinking: false,
        blinkInterval: null,
        thinkingInterval: null,
        showStatus: false,
        statusText: '',
        mouthType: 'smile'
      };
    },
    watch: {
      mood: {
        immediate: true,
        handler(newMood) {
          this.updateMouthType(newMood);
          this.updateStatusText(newMood);
          
          // Reset animations when mood changes
          clearInterval(this.thinkingInterval);
          
          if (newMood === 'thinking') {
            this.startThinkingAnimation();
          } else if (newMood === 'laughing') {
            this.startLaughingAnimation();
          } else if (newMood === 'excited') {
            this.bounceAnimation();
          } else if (newMood === 'surprised') {
            this.surpriseAnimation();
          }
        }
      },
      isStreaming(newVal) {
        if (newVal) {
          this.startTypingAnimation();
        } else {
          clearInterval(this.typingInterval);
        }
      }
    },
    mounted() {
      // Start periodic blinking
      this.startBlinking();
      
      // Initial animation based on mood
      if (this.mood === 'thinking') {
        this.startThinkingAnimation();
      }
    },
    beforeUnmount() {
      // Clean up all intervals
      clearInterval(this.blinkInterval);
      clearInterval(this.thinkingInterval);
      clearInterval(this.typingInterval);
    },
    methods: {
      updateMouthType(mood) {
        switch (mood) {
          case 'happy':
          case 'excited':
            this.mouthType = 'big-smile';
            break;
          case 'sad':
            this.mouthType = 'frown';
            break;
          case 'surprised':
            this.mouthType = 'o-mouth';
            break;
          case 'thinking':
            this.mouthType = 'neutral-mouth';
            break;
          case 'laughing':
            this.mouthType = 'laughing';
            break;
          case 'confused':
            this.mouthType = 'squiggle';
            break;
          case 'empathetic':
            this.mouthType = 'soft-smile';
            break;
          default:
            this.mouthType = 'smile';
        }
      },
      updateStatusText(mood) {
        this.showStatus = true;
        
        switch (mood) {
          case 'thinking':
            this.statusText = 'Thinking...';
            break;
          case 'excited':
            this.statusText = 'Awesome!';
            break;
          case 'surprised':
            this.statusText = 'Oh!';
            break;
          case 'confused':
            this.statusText = 'Hmm?';
            break;
          case 'laughing':
            this.statusText = 'Haha!';
            break;
          default:
            this.showStatus = false;
            this.statusText = '';
        }
      },
      startBlinking() {
        this.blinkInterval = setInterval(() => {
          this.isBlinking = true;
          setTimeout(() => {
            this.isBlinking = false;
          }, 200);
        }, 4000 + Math.random() * 3000); // Random blink interval between 4-7 seconds
      },
      startThinkingAnimation() {
        let headTilt = 0;
        
        this.thinkingInterval = setInterval(() => {
          // Alternate subtle head tilt
          headTilt = headTilt ? 0 : 1;
          const head = document.querySelector('.senticon .head');
          if (head) {
            head.style.transform = headTilt ? 'rotate(2deg)' : 'rotate(-1deg)';
          }
        }, 1200);
      },
      startLaughingAnimation() {
        let bounceUp = true;
        
        this.thinkingInterval = setInterval(() => {
          bounceUp = !bounceUp;
          const head = document.querySelector('.senticon .head');
          if (head) {
            head.style.transform = bounceUp ? 'translateY(-2px)' : 'translateY(2px)';
          }
        }, 150);
      },
      bounceAnimation() {
        const head = document.querySelector('.senticon .head');
        if (head) {
          head.classList.add('bounce');
          setTimeout(() => {
            head.classList.remove('bounce');
          }, 1000);
        }
      },
      surpriseAnimation() {
        const senticon = document.querySelector('.senticon');
        if (senticon) {
          senticon.classList.add('surprise-anim');
          setTimeout(() => {
            senticon.classList.remove('surprise-anim');
          }, 1000);
        }
      },
      startTypingAnimation() {
        // Animation for when the AI is typing/streaming a response
        this.typingInterval = setInterval(() => {
          const mouth = document.querySelector('.senticon .mouth');
          if (mouth) {
            mouth.classList.toggle('typing');
          }
        }, 300);
      }
    }
  };
  </script>
  
  <style scoped>
  .senticon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-right: 12px;
    position: relative;
  }
  
  .senticon {
    width: 100%;
    height: 100%;
    position: relative;
    transition: all 0.3s ease;
  }
  
  .senticon-face {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 2;
  }
  
  .head {
    background-color: #2d2d2d;
    border-radius: 12px;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    border: 3px solid #ff5722;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    animation: float 3s ease-in-out infinite;
  }
  
  .eyes {
    position: absolute;
    top: 35%;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-around;
    transform: translateY(-50%);
  }
  
  .eye {
    width: 8px;
    height: 8px;
    background-color: #37e6e6;
    border-radius: 50%;
    position: relative;
    animation: blink 0.2s ease both;
    animation-play-state: paused;
  }
  
  .senticon.thinking .eye {
    transform: translateX(-2px) scaleY(0.8);
  }
  
  .senticon.confused .eye {
    animation: confused-look 3s ease-in-out infinite;
  }
  
  .senticon.thinking .right-eye {
    transform: translateX(2px) scaleY(0.8);
  }
  
  .senticon.laughing .eye {
    height: 2px;
    transform: translateY(2px) scaleY(0.3);
  }
  
  .senticon.surprised .eye {
    width: 10px;
    height: 10px;
    animation: none;
  }
  
  .pupil {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #37e6e6;
    position: relative;
  }
  
  .highlight {
    position: absolute;
    top: 10%;
    left: 10%;
    width: 30%;
    height: 30%;
    background-color: white;
    border-radius: 50%;
    opacity: 0.7;
  }
  
  .mouth {
    position: absolute;
    bottom: 25%;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 6px;
    background-color: transparent;
    border-radius: 100px;
    border-bottom: 2px solid #37e6e6;
    transition: all 0.3s ease;
  }
  
  /* Different mouth types */
  .mouth.smile {
    border-radius: 100px;
    border-bottom: 2px solid #37e6e6;
    height: 6px;
    width: 14px;
  }
  
  .mouth.big-smile {
    border-radius: 100px;
    border-bottom: 3px solid #37e6e6;
    height: 8px;
    width: 18px;
  }
  
  .mouth.frown {
    border-top: 2px solid #37e6e6;
    border-bottom: none;
    height: 6px;
    top: 70%;
  }
  
  .mouth.o-mouth {
    border: 2px solid #37e6e6;
    height: 8px;
    width: 8px;
    border-radius: 50%;
  }
  
  .mouth.neutral-mouth {
    border-radius: 0;
    border-bottom: none;
    border-top: none;
    background-color: #37e6e6;
    height: 2px;
    width: 10px;
  }
  
  .mouth.laughing {
    border-radius: 50%;
    border: none;
    background-color: #37e6e6;
    height: 6px;
    width: 10px;
  }
  
  .mouth.squiggle {
    width: 12px;
    height: 4px;
    background-image: linear-gradient(45deg, #37e6e6 25%, transparent 25%, transparent 75%, #37e6e6 75%),
                      linear-gradient(45deg, #37e6e6 25%, transparent 25%, transparent 75%, #37e6e6 75%);
    background-size: 4px 4px;
    background-position: 0 0, 2px 2px;
    border: none;
  }
  
  .mouth.soft-smile {
    border-radius: 100px;
    border-bottom: 2px solid #37e6e6;
    height: 4px;
    width: 12px;
  }
  
  .mouth.typing {
    width: 8px;
    height: 2px;
  }
  
  /* Mood ring */
  .mood-ring {
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 15px;
    border: 2px solid transparent;
    z-index: 1;
    opacity: 0.7;
    animation: pulse 2s infinite;
  }
  
  .mood-ring.neutral {
    border-color: #37e6e6;
  }
  
  .mood-ring.thinking {
    border-color: #9c27b0;
  }
  
  .mood-ring.happy {
    border-color: #4caf50;
  }
  
  .mood-ring.excited {
    border-color: #ff9800;
  }
  
  .mood-ring.surprised {
    border-color: #ff5722;
  }
  
  .mood-ring.sad {
    border-color: #2196f3;
  }
  
  .mood-ring.confused {
    border-color: #ffeb3b;
  }
  
  .mood-ring.empathetic {
    border-color: #9c27b0;
  }
  
  .mood-ring.laughing {
    border-color: #ff9800;
  }
  
  /* Status text */
  .status-text {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 3px 8px;
    border-radius: 10px;
    animation: fadeInOut 2s ease infinite;
  }
  
  /* Animation keyframes */
  @keyframes blink {
    0% { transform: scaleY(1); }
    20% { transform: scaleY(0.1); }
    40% { transform: scaleY(1); }
  }
  
  @keyframes pulse {
    0% { opacity: 0.4; }
    50% { opacity: 0.8; }
    100% { opacity: 0.4; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  
  @keyframes fadeInOut {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  
  @keyframes confused-look {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(1px) rotate(5deg); }
    75% { transform: translateX(-1px) rotate(-5deg); }
  }
  
  /* Dynamic animation application */
  .senticon.animating .eye.isBlinking {
    animation-play-state: running;
  }
  
  .bounce {
    animation: bounce 0.5s ease infinite;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  .surprise-anim {
    animation: surprise 0.5s ease;
  }
  
  @keyframes surprise {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  </style>