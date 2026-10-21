import sharp from 'sharp';
import { generateOgImage, loadLogo, OG_WIDTH } from '../../../og/generate.js';
import { postTemplate } from '../../../og/post.js';
import { posts as loadPosts } from '../../../data/blog.js';
import { version } from '../../../data/llms.js';

/* One social card per blog post, drawn over the post's cover when it
   has one. Base.astro points each post's og:image here. */
export async function getStaticPaths() {
  const posts = await loadPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

/* The cover cropped to the card's top band, from the top edge, as a
   data URI. Covers keep their art in the upper half and their caption
   below, so the band shows the art and the title band shows the title.
   The content layer keeps the original file's path on the image metadata. */
const COVER_HEIGHT = 372;

async function coverData(cover) {
  if (!cover?.fsPath) return null;
  const jpeg = await sharp(cover.fsPath)
    .resize(OG_WIDTH, COVER_HEIGHT, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 82 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

export async function GET({ props }) {
  const { data } = props.post;
  const png = await generateOgImage(
    postTemplate({
      title: data.title,
      description: data.description,
      date: data.date,
      cover: await coverData(data.cover),
      logo: await loadLogo(),
      version,
    })
  );

  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
}
