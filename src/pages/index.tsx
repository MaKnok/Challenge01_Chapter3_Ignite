import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState, useEffect } from 'react';

import Prismic from '@prismicio/client';

import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Post from './post/[slug]';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  first_publication_date_formatted: string;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const formattedPosts = posts.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
      first_publication_date_formatted: format(
        new Date(post.first_publication_date),
        'd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  async function handleNextPage() {
    const response = await fetch(`${postsPagination.next_page}`);
    const postsResults = await response.json();

    const formattedPostResults = postsResults.results.map(post => {
      return {
        uid: post.uid,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
        first_publication_date: post.first_publication_date,
        first_publication_date_formatted: format(
          new Date(post.first_publication_date),
          'd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    });

    setNextPage(postsResults.next_page);
    setPosts([...posts, ...formattedPostResults]);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={styles.contentContainer}>
        <img src="/images/Logo.svg" alt="logo" />

        <section>
          <div className={styles.posts}>
            {formattedPosts.map(post => (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <strong>{post.data.title}</strong>

                  <p>{post.data.subtitle}</p>

                  <div className={commonStyles.infoContainer}>
                    <div className={commonStyles.infoContent}>
                      <FiCalendar color="#BBBBBB" />
                      <time className={commonStyles.timeStyle}>
                        {post.first_publication_date_formatted}
                      </time>
                    </div>

                    <div className={commonStyles.infoContent}>
                      <FiUser color="#BBBBBB" />
                      <h6 className={commonStyles.authorStyle}>
                        {post.data.author}
                      </h6>
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </section>

        {nextPage && (
          <button
            className={styles.morePosts}
            onClick={handleNextPage}
            type="button"
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author', 'posts.content'],
      orderings: '[document.first_publication_date]',
      pageSize: 1,
    }
  );

  const { results, next_page } = postsResponse;

  console.log(JSON.stringify(results, null, 2));
  console.log(JSON.stringify(next_page, null, 2));

  const postsPagination = {
    next_page,
    results,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
