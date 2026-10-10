// Book structure. Page 'n' is the printed page number (cover = 0).
export const CHAPTERS = [
  { id:'contents', name:'Contents', from:1, to:2, color:'#1B1A22' },
  { id:'posters', name:'Media Posters', from:3, to:7, color:'#F2B600' },
  { id:'thumbs', name:'YouTube Thumbnails', from:8, to:10, color:'#28C37B' },
  { id:'mockups', name:'Decent Mockups', from:11, to:14, color:'#0088FF' },
  { id:'end', name:'Ending', from:15, to:15, color:'#EE1C25' },
]
export const PAGE_TITLES = {
  1:'Contents', 2:'Page index',
  3:'Media Posters', 4:'BBQ and Burger House', 5:'Nail Polish and Gold Beauty',
  6:'Special Burger, Patriot Burger', 7:'Air Jordan and New Shoes',
  8:'YouTube Thumbnails', 9:'Thumbnail Design, Instagram Features',
  10:'Instagram or Facebook, Earn Money', 11:'Decent Mockups',
  12:'Chips and Cap', 13:'Sport Bottle and Burger Box', 14:'Book and Football Shirt', 15:'Thank you',
}
export const TOTAL_PAGES = 15
export const chapterOf = (n) => CHAPTERS.find(c => n >= c.from && n <= c.to)
