import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';

import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';

import { RichText } from 'prismic-dom';
import { unlink } from 'fs';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
    contentAsText: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { content } = post.data;
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const contentData = content.map(ct => {
    return {
      heading: ct.heading,
      body: RichText.asHtml(ct.body),
    };
  });

  const contentAsText = content.map(ct => {
    return {
      heading: ct.heading,
      body: ct.body.map(bd => {
        return {
          text: bd.text,
        };
      }),
    };
  });

  const postData = {
    first_publication_date: format(
      new Date(post.first_publication_date),
      'd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: post.data.title,
      banner: {
        url: post.data.banner.url,
      },
      author: post.data.author,
      content: contentData,
    },
  };

  const contentText = contentAsText.map(txt => {
    return {
      heading: txt.heading.split(' '),
      body: txt.body.map(bd => {
        return {
          text: bd.text.split(/\s/),
        };
      }),
    };
  });

  const numberOfWords = Object.values(contentText);

  const mappedNumberOfWords = numberOfWords.map(now => {
    return {
      heading: now.heading.length,
      body: now.body.map(bd => {
        return {
          text: bd.text.length,
        };
      }),
    };
  });

  const totalWordsHeading = mappedNumberOfWords.reduce(
    (sum, li) => sum + li.heading,
    0
  );

  const totalWordsBody = mappedNumberOfWords.reduce(
    (sum, li) =>
      sum + li.body.map(bd => bd.text).reduce((acc, val) => acc + val, 0),
    0
  );

  const totalWords = totalWordsHeading + totalWordsBody;

  function TimeOfReading(totalNumberOfWords): number {
    const wordsPerMinute = totalNumberOfWords / 200;
    return Math.ceil(wordsPerMinute);
  }

  const TimeReading = TimeOfReading(totalWords);

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>
      <Header />

      <main>
        <div>
          <img src={postData.data.banner.url} alt="banner" />
        </div>
        <article className={styles.post}>
          <h1>{postData.data.title}</h1>

          <div className={commonStyles.infoContainer}>
            <div className={commonStyles.infoContent}>
              <FiCalendar color="#BBBBBB" />
              <time className={commonStyles.timeStyle}>
                {postData.first_publication_date}
              </time>
            </div>

            <div className={commonStyles.infoContent}>
              <FiUser color="#BBBBBB" />
              <h6 className={commonStyles.authorStyle}>
                {postData.data.author}
              </h6>
            </div>

            <div className={commonStyles.infoContent}>
              <FiClock color="#BBBBBB" />
              <h6 className={commonStyles.readingTimeStyle}>
                {`${TimeReading} min`}
              </h6>
            </div>
          </div>

          <ul>
            {contentData.map((postContent, i) => (
              <li key={`postContent-${i}`} className={styles.contentContainer}>
                <h2>{postContent.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{ __html: postContent.body }}
                  className={styles.postContentBody}
                />
              </li>
            ))}
          </ul>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
    }
  );

  return {
    paths: [
      { params: { slug: 'como-utilizar-hooks' } },
      { params: { slug: 'criando-um-app-cra-do-zero' } },
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = response;

  return {
    props: {
      post,
    },
    revalidate: 1,
  };
};
