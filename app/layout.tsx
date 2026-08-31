import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'ReLoom — Wear the next chapter',
  metadataBase: new URL('https://reloom-mobile.z1oey12.chatgpt.site'),
  openGraph: {title:'ReLoom — Wear the next chapter', description:'Explore upcycled fashion and follow each garment’s next chapter. Interactive prototype.', images:['/og.png']},
  twitter: {card:'summary_large_image',title:'ReLoom — Wear the next chapter',description:'Explore upcycled fashion. Interactive prototype.',images:['/og.png']},
  description: 'Explore upcycled fashion, donate garments and follow their next chapter. An interactive ReLoom prototype.',
};
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#0088b0'};
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) {
 return <html lang="en"><body>{children}</body></html>;
}
