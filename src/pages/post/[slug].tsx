import { GetStaticPaths, GetStaticProps } from 'next';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';

import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';

import { RichText } from 'prismic-dom';
import { unlink } from 'fs';
import { useUtterances } from '../../hooks/useUtterances';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

const commentNodeId = 'comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  last_publication_hour: string | null;
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

// create an interface for single neighbor post
interface NeighborPost {
  title: string;
  slug: string;
}

// create an interface for neighbor posts, defining prev and next
interface NeighborsPosts {
  prevPost: NeighborPost;
  nextPost: NeighborPost;
}

interface PostProps {
  post: Post;
  neighborsPosts: NeighborsPosts;
  preview: boolean;
}

export default function Post({
  post,
  neighborsPosts,
  preview,
}: PostProps): JSX.Element {
  // initialize next post, it initializes in title:'', slug:''
  const [nextPost, setNextPost] = useState<NeighborPost | false>({
    title: '',
    slug: '',
  });

  // initialize prev post, it initializes in title:'', slug:''
  const [prevPost, setPrevPost] = useState<NeighborPost | false>({
    title: '',
    slug: '',
  });

  function loadNeighborsPosts(): void {
    if (neighborsPosts.nextPost) {
      setNextPost({
        title: neighborsPosts.nextPost.title,
        slug: neighborsPosts.nextPost.slug,
      });
    } else {
      setNextPost(false);
    }

    if (neighborsPosts.prevPost) {
      setPrevPost({
        title: neighborsPosts.prevPost.title,
        slug: neighborsPosts.prevPost.slug,
      });
    } else {
      setPrevPost(false);
    }
  }

  useEffect(() => {
    loadNeighborsPosts();
  }, [post]);

  const router = useRouter();

  useUtterances(commentNodeId);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  // it loads the next or previous neighbors posts only if they exist

  // execute the function loadNeighborPosts() everytime the array[post] has it's
  // current index updated.

  const { content } = post.data;

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
    last_publication_date: format(
      new Date(post.last_publication_date),
      'd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    last_publication_hour: format(
      new Date(post.last_publication_date),
      'HH:mm',
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

          <div className={commonStyles.lastEditedStyle}>
            * editado em {postData.last_publication_date}, às
            {postData.last_publication_hour}
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

          <footer className={styles.footerContainer}>
            <hr className={styles.footerDivisor} />
            <div
              className={
                prevPost
                  ? styles.neighborPostsContainer
                  : styles.neighborPostsContainerNoPrevious
              }
            >
              {prevPost ? (
                <Link href={`/post/${prevPost?.slug}`}>
                  <div className={styles.previousPosts}>
                    <span>{prevPost?.title}</span>
                    <span className={styles.previousPost}>Post Anterior</span>
                  </div>
                </Link>
              ) : (
                ''
              )}

              {nextPost ? (
                <Link href={`/post/${nextPost?.slug}`}>
                  <div className={styles.nextPosts}>
                    <span>{nextPost?.title}</span>
                    <span className={styles.nextPost}>Próximo Post</span>
                  </div>
                </Link>
              ) : (
                ''
              )}
            </div>
            <div id={commentNodeId} />
            {preview && (
              <aside className={styles.exitPreviewMode}>
                <Link href="/api/exit-preview">
                  <a>Sair do modo Preview</a>
                </Link>
              </aside>
            )}
          </footer>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      orderings: '[document.first_publication_date]',
      pageSize: 3,
    }
  );

  const slugs = posts.results.reduce((arr, post) => {
    arr.push(post.uid);

    return arr;
  }, []);

  const params = slugs.map(slug => {
    return {
      params: { slug },
    };
  });

  return {
    paths: params,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = response;

  // fetch next post data from prismic api
  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date]',
      after: `${response.id}`,
    }
  );

  // fetch previous post data from prismic api
  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
      after: `${response.id}`,
    }
  );

  // store in the const neighborsPosts conditionals for the objects
  const neighborsPosts = {
    prevPost:
      prevPost.results_size > 0
        ? {
            title: prevPost.results[0].data.title,
            slug: prevPost.results[0].uid,
          }
        : false,
    nextPost:
      nextPost.results_size > 0
        ? {
            title: nextPost.results[0].data.title,
            slug: nextPost.results[0].uid,
          }
        : false,
  };

  console.log(neighborsPosts);

  return {
    props: {
      post,
      neighborsPosts,
      preview,
    },
    revalidate: 60 * 60, // 1 hour,
  };
};
