(function () {
      const surface = document.getElementById('surface');

      let isFlipped = false;
      let isAnimating = false;
      let isDragging = false;
      let animTimeout = null;

      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let currentY = 0;
      let startTime = 0;
      let moveStartTime = 0;
      let moveCount = 0;
      let baseRotation = 0;
      let currentRotation = 0;

      const MIN_HOLD_TIME = 900;
      const MIN_MOVE_TIME = 750;
      const MIN_MOVE_COUNT = 8;
      const MAX_SPEED = 0.32;

      function getMinDistance() {
        return Math.min(130, window.innerWidth * 0.35);
      }

      function onPointerStart(x, y) {
        if (isAnimating) return;

        isDragging = true;
        startX = x;
        startY = y;
        currentX = x;
        currentY = y;
        startTime = Date.now();
        moveStartTime = 0;
        moveCount = 0;

        surface.style.transition = 'none';
      }

      function onPointerMove(x, y, e) {
        if (!isDragging || isAnimating) return;

        currentX = x;
        currentY = y;

        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY && absX > 8) {
          if (e && e.cancelable) e.preventDefault();
        }

        if (absY > absX && absY > 20) {
          return;
        }

        if (absX > 10) {
          if (moveStartTime === 0) {
            moveStartTime = Date.now();
          }
          moveCount++;

          const screenSpan = Math.max(300, window.innerWidth * 0.75);
          const dragFactor = (deltaX / screenSpan) * 180;
          currentRotation = baseRotation + dragFactor;

          surface.style.transform = 'rotateY(' + currentRotation + 'deg)';
        }
      }

      function onPointerEnd() {
        if (!isDragging || isAnimating) return;
        isDragging = false;

        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        const moveDuration = moveStartTime > 0 ? (endTime - moveStartTime) : 0;

        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const speed = absX / Math.max(totalDuration, 1);

        const minDistance = getMinDistance();

        const isHorizontal = absX > absY * 1.4;
        const hasDistance = absX >= minDistance;
        const hasDuration = totalDuration >= MIN_HOLD_TIME && moveDuration >= MIN_MOVE_TIME;
        const isNotFlick = speed <= MAX_SPEED && moveCount >= MIN_MOVE_COUNT;

        const isQualified = isHorizontal && hasDistance && hasDuration && isNotFlick;

        if (isQualified) {
          completeFlip(deltaX);
        } else {
          cancelFlip();
        }
      }

      function completeFlip(deltaX) {
        isAnimating = true;
        clearTimeout(animTimeout);

        let targetRotation;
        if (!isFlipped) {
          targetRotation = deltaX < 0 ? -180 : 180;
          isFlipped = true;
        } else {
          if (baseRotation === 180) {
            targetRotation = deltaX < 0 ? 0 : 360;
          } else {
            targetRotation = deltaX > 0 ? 0 : -360;
          }
          isFlipped = false;
        }

        baseRotation = targetRotation;
        currentRotation = targetRotation;

        surface.style.transition = 'transform 1.25s cubic-bezier(0.2, 0.8, 0.25, 1)';
        surface.style.transform = 'rotateY(' + targetRotation + 'deg)';

        animTimeout = setTimeout(function () {
          isAnimating = false;
        }, 1350);
      }

      function cancelFlip() {
        if (currentRotation === baseRotation) {
          isAnimating = false;
          return;
        }

        isAnimating = true;
        clearTimeout(animTimeout);

        currentRotation = baseRotation;
        surface.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        surface.style.transform = 'rotateY(' + baseRotation + 'deg)';

        animTimeout = setTimeout(function () {
          isAnimating = false;
        }, 450);
      }

      surface.addEventListener('transitionend', function (e) {
        if (e.target !== surface || e.propertyName !== 'transform') return;
        isAnimating = false;
        clearTimeout(animTimeout);

        if (baseRotation === 360 || baseRotation === -360) {
          baseRotation = 0;
          currentRotation = 0;
          surface.style.transition = 'none';
          surface.style.transform = 'rotateY(0deg)';
          surface.offsetHeight;
        }
      });

      surface.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
          onPointerStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      surface.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1) {
          onPointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
        }
      }, { passive: false });

      surface.addEventListener('touchend', function (e) {
        if (e.changedTouches && e.changedTouches.length === 1) {
          currentX = e.changedTouches[0].clientX;
          currentY = e.changedTouches[0].clientY;
        }
        onPointerEnd();
      }, { passive: true });

      surface.addEventListener('touchcancel', function () {
        if (isDragging) {
          isDragging = false;
          cancelFlip();
        }
      }, { passive: true });

      surface.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        onPointerStart(e.clientX, e.clientY);
      });

      window.addEventListener('mousemove', function (e) {
        if (isDragging) {
          onPointerMove(e.clientX, e.clientY, e);
        }
      });

      window.addEventListener('mouseup', function () {
        if (isDragging) {
          onPointerEnd();
        }
      });
    })();
