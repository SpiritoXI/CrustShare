import SharePage from './SharePage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ cid: 'placeholder' }];
}

export default SharePage;
