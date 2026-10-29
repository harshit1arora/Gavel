import React from "react";
import { Link } from "react-router-dom";
import { BLOG_POSTS } from "@/data/blog-posts";
import { FadeUp } from "./gavel/FadeUp";

const BlogSection = () => {
  const recentPosts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="py-24 bg-background border-t border-border/40 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <FadeUp>
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-['DM_Sans'] text-foreground mb-4">
              From our blog
            </h2>
            <p className="text-lg text-muted-foreground font-['DM_Sans'] max-w-2xl">
              Latest insights on automated underwriting, RBI compliance, and NBFC technology.
            </p>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-8">
          {recentPosts.map((post, i) => (
            <FadeUp key={post.slug} delay={i * 0.1}>
              <Link to={`/blog/${post.slug}`} className="block h-full group">
                <article className="h-full border border-border p-6 rounded-[12px] bg-muted/10 hover:bg-muted/30 transition-all hover:border-foreground/20 flex flex-col">
                  <div className="text-xs font-['JetBrains_Mono'] text-primary mb-3">
                    {post.date}
                  </div>
                  <h3 className="text-xl font-bold font-['DM_Sans'] text-foreground mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground font-['DM_Sans'] text-sm mb-4 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="text-sm font-semibold font-['DM_Sans'] text-foreground flex items-center gap-2">
                    Read article <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </article>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
