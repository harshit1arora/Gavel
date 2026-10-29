import React from "react";
import { useParams, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BLOG_POSTS } from "@/data/blog-posts";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "author": { "@type": "Organization", "name": "Gavel AI" },
    "publisher": { "@type": "Organization", "name": "Gavel AI", "logo": "https://www.trygavel.com/gavel-logo.png" },
    "datePublished": new Date(post.date).toISOString(),
    "dateModified": new Date(post.date).toISOString()
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{post.title}: Gavel AI Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://www.trygavel.com/blog/${slug}`} />
        <meta property="og:title" content={`${post.title}: Gavel AI Blog`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:url" content={`https://www.trygavel.com/blog/${slug}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.title}: Gavel AI Blog`} />
        <meta name="twitter:description" content={post.excerpt} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <Navbar />
      <main className="flex-1 container mx-auto px-6 py-24 max-w-3xl">
        <article>
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold font-['DM_Sans'] text-foreground mb-4 leading-tight">{post.title}</h1>
            <div className="text-muted-foreground font-['JetBrains_Mono']">{post.date}</div>
          </header>
          <div className="prose dark:prose-invert prose-orange max-w-none font-['DM_Sans'] text-foreground/80 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        <div className="mt-20 pt-10 border-t border-border">
          <h3 className="text-2xl font-bold font-['DM_Sans'] text-foreground mb-6">Related Posts</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 2).map(related => (
              <a key={related.slug} href={`/blog/${related.slug}`} className="block border border-border p-6 rounded-lg bg-muted/10 hover:bg-muted/30 transition-colors">
                <h4 className="text-lg font-bold font-['DM_Sans'] text-foreground mb-2">{related.title}</h4>
                <p className="text-sm text-muted-foreground font-['DM_Sans'] line-clamp-2 mb-4">{related.excerpt}</p>
                <div className="text-xs font-['JetBrains_Mono'] text-primary">{related.date}</div>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
