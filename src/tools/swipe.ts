import { useEffect, useState } from 'react'

export function useSwipe(
  element: HTMLElement | null,
  draggable:HTMLElement | null,
  height: number,
  noSwipeElementsRef?:  React.MutableRefObject<{
      carSliderRef: HTMLDivElement | null;
      seatSliderRef: HTMLDivElement | null;
    }>,
  speed = 300,
) {

  const [isExpanded, setIsExpanded] = useState(false)

  let carSlider: HTMLDivElement | null | undefined = null
  let seatSlider: HTMLDivElement | null | undefined = null

  let startY: number,
    startTime: number,
    deltaY = 0,
    currentY = 0,
    canMove = false


  useEffect(() => {
    if (!draggable || !element) return
    carSlider = noSwipeElementsRef?.current?.carSliderRef
    seatSlider = noSwipeElementsRef?.current?.seatSliderRef
    draggable.addEventListener('touchstart', start)
    document.addEventListener('touchmove', move)
    document.addEventListener('touchend', end)

    return () => {
      draggable.removeEventListener('touchstart', start)
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', end)
    }
  }, [draggable, element, noSwipeElementsRef?.current?.carSliderRef, noSwipeElementsRef?.current?.seatSliderRef])



  function start(e: TouchEvent) {
    if (!element) return
    if (carSlider?.contains(e.target as Node) || seatSlider?.contains(e.target as Node)) {
      canMove
      return
    }
    // console.log(carSlider)
    // console.log( seatSlider)
    // console.log(noSwipeElementsRef?.current.carSliderRef)
    // console.log(e.target)
    canMove = true
    startY = e.touches[0].clientY
    startTime = Date.now()
    element.style.transition = 'none'
  }

  function move(e: TouchEvent) {
    if (!element) return
    if (!canMove) return
    deltaY = e.touches[0].clientY - startY
    if (
      deltaY < 0 &&
            element.style.transform === `translateY(${-height}px)`
    ) {
      return
    }
    if (deltaY > 0 && element.style.transform === `translateY(${0}px)`) {
      return
    }
    element.style.transform = `translateY(${currentY + deltaY}px)`

  }
  function end() {
    if (!element) return
    const endTime = Date.now()
    const duration = endTime - startTime
    element.style.transition = 'transform 0.3s ease'

    if (
      duration < speed ||
            deltaY > height / 2 ||
            deltaY < -height / 2
    ) {
      if (deltaY > 0) {
        element.style.transform = `translateY(${0}px)`
        currentY = 0
        setIsExpanded(false)
      }
      if (deltaY < 0) {
        element.style.transform = `translateY(${-height}px)`
        currentY = -height
        setIsExpanded(true)
      }
    } else {
      element.style.transform = `translateY(${currentY}px)`
    }
    canMove = false
  }

  return { isExpanded }
}



// export function swipe(
//     element: HTMLElement,
//     draggable:HTMLElement,
//     speed = 300,
//     height = 312
// ) {
//     let startY: number,
//         startTime: number,
//         deltaY = 0,
//         currentY = 0,
//         canMove = false;

//     draggable.addEventListener("touchstart", start);
//     document.addEventListener("touchmove", move);
//     document.addEventListener("touchend", end);

//     function start(e: TouchEvent) {
//         if (e.target) canMove = true
//         startY = e.touches[0].clientY;
//         startTime = Date.now();
//         element.style.transition = "none";
//     }

//     function move(e: TouchEvent) {
//         if (!canMove) return
//         deltaY = e.touches[0].clientY - startY;
//         if (
//             deltaY < 0 &&
//             element.style.transform === `translateY(${-height}px)`
//         ) {
//             return;
//         }
//         if (deltaY > 0 && element.style.transform === `translateY(${0}px)`) {
//             return;
//         }
//         element.style.transform = `translateY(${currentY + deltaY}px)`;
//     }
//     function end() {
//         const endTime = Date.now();
//         const duration = endTime - startTime;
//         // document.body.style.overflow = "";
//         element.style.transition = "transform 0.3s ease";

//         if (
//             duration < speed ||
//             deltaY > height / 2 ||
//             deltaY < -height / 2
//         ) {
//             if (deltaY > 0) {
//                 element.style.transform = `translateY(${0}px)`;
//                 currentY = 0;
//             }
//             if (deltaY < 0) {
//                 element.style.transform = `translateY(${-height}px)`;
//                 currentY = -height;
//             }
//         } else {
//             element.style.transform = `translateY(${currentY}px)`;
//             console.log("startY in the end", startY);
//         }
//         canMove = false
//     }

//     return [
//         () => {
//             draggable.removeEventListener("touchstart", start);
//         },
//         () => {
//             document.removeEventListener("touchmove", move);
//         },
//         () => {
//             document.removeEventListener("touchend", end);
//         },
//     ];
// }

// export function swipe(
//     element: HTMLElement,
//     speed = 300,
//     swipeHeight: number,
//     scrollingElement: HTMLElement,
//     noneScrollingElement: HTMLElement
// ) {
//     let startY: number,
//         startTime: number,
//         isCanMove = false,
//         isScrolling = false,
//         deltaY = 0,
//         currentY = 0;

//     element.addEventListener("touchstart", start);
//     document.addEventListener("touchmove", move);
//     document.addEventListener("touchend", end);
//     scrollingElement.addEventListener("scroll", scrolling);

//     function scrolling() {
//         isCanMove = false;
//         console.log(isCanMove);
//         // console.log("scrolling", isScrolling);
//         // element.style.transition = "none";
//         // document.body.style.overflow = "hidden";
//     }

//     function start(e: TouchEvent) {
//         console.log("startY", e.touches[0].clientY);
//         startY = e.touches[0].clientY;
//         startTime = Date.now();
//         element.style.transition = "none";
//         document.body.style.overflow = "hidden";
//         if (scrollingElement.scrollTop > 0) {
//             isCanMove = false;
//         } else {
//             isCanMove = true;
//         }
//     }

//     function move(e: TouchEvent) {
//         if (scrollingElement.scrollTop > 0) {
//             noneScrollingElement.style.boxShadow =
//                 "0px 17px 19px 0px rgba(34, 60, 80, 0.7)";
//         } else {
//             noneScrollingElement.style.boxShadow = "none";
//         }
//         if (!isCanMove) return;

//         if (scrollingElement.scrollTop > 0) {
//             isScrolling = true;
//         } else {
//             isScrolling = false;
//         }

//         deltaY = e.touches[0].clientY - startY;
//         if (
//             deltaY < 0 &&
//             element.style.transform === `translateY(${-swipeHeight}px)`
//         ) {
//             return;
//         }
//         if (deltaY > 0 && element.style.transform === `translateY(${0}px)`) {
//             return;
//         }
//         element.style.transform = `translateY(${currentY + deltaY}px)`;
//     }
//     function end() {
//         const endTime = Date.now();
//         const duration = endTime - startTime;
//         document.body.style.overflow = "";
//         element.style.transition = "transform 0.3s ease";

//         if (
//             duration < speed ||
//             deltaY > swipeHeight / 2 ||
//             deltaY < -swipeHeight / 2
//         ) {
//             if (deltaY > 0) {
//                 element.style.transform = `translateY(${0}px)`;
//                 currentY = 0;
//             }
//             if (deltaY < 0) {
//                 element.style.transform = `translateY(${-swipeHeight}px)`;
//                 currentY = -swipeHeight;
//             }
//         } else {
//             element.style.transform = `translateY(${currentY}px)`;
//             console.log("startY in the end", startY);
//         }

//         isCanMove = false;
//     }

//     return [
//         () => {
//             element.removeEventListener("touchstart", start);
//         },
//         () => {
//             element.removeEventListener("touchmove", move);
//         },
//         () => {
//             element.removeEventListener("touchend", end);
//         },
//         () => {
//             scrollingElement.removeEventListener("scroll", scrolling);
//         },
//     ];
// }
