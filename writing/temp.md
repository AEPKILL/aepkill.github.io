window:

	1. innerHeight
	2. outerHeight
	3. innerWidth
	4. outerWidth 

> 以上兼容 IE9 +

screen:

1. height
2. availHeight
3. width
4. availHeight
5. screenTop
6. screenLeft



document:

* client

  1. clientWidth

  2. clientHeight  

     [width + padding + conentWidth - scrollBarWidth]

  3. clientLeft 

     [border-left-width]

  4. clientTop

     [border-top-width]

* offset

  1. offsetWidth

  2. offsetHeight 

     [border + padding + conentWidth]

  3. offsetLeft

  4. offsetTop 

  5. offsetParent

     当前元素offsetLeft 及 offsetTop 基于这个元素计算，如果当前父元素没有进行CSS定位的话，offsetParent为body，否则offsetParent为最近一个定位过的父元素

* scroll

  1. scrollWidth
  2. scrollHeight

Event:

1. clientX

2. clientY

   相对可视区域左上角的坐标

3. screenX

4. screenY

   相对屏幕左上角的坐标

5. offsetX

6. offsetY

   相对于事件源左上角的坐标

7. pageX

8. pageY

   相对整个网页左上角的坐标

9. x

10. y

    IE是相对CSS动态定位的最内层包容元素，Chrome 等同 client

Function：

​	GetBoundingClientRect();

​	GetComputedStyle();





jQuery:

1. width()

   width

2. innerWidth()

   width + padding

3. outerWidth()

   width + padding + border + [margin?]

4. height()

5. innerHeight()

6. outerHeight()