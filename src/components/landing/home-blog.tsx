import Link from "next/link";
import { BLOG_POSTS } from "@/data/home-content";
import "./home-blog.css";

export function HomeBlog() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <section className="cv-blog">
      <div className="cv-container">
        <div className="cv-blog-head">
          <div>
            <p className="cv-eyebrow">From the team</p>
            <h2 className="cv-section-title" style={{ marginTop: "0.75rem" }}>
              Browse our latest articles
            </h2>
          </div>
          <Link href="/events" className="cv-blog-all">
            All posts →
          </Link>
        </div>

        <div className="cv-blog-asymmetric">
          <Link href={featured.href} className="cv-blog-featured">
            <div className="cv-blog-featured-media" aria-hidden />
            <div className="cv-blog-featured-body">
              <p className="cv-blog-meta">
                {featured.date} · {featured.readTime} read
              </p>
              <h3>{featured.title}</h3>
              <p>{featured.excerpt}</p>
              <span className="cv-blog-read">Read Article</span>
            </div>
          </Link>

          <div className="cv-blog-stack">
            {rest.map((post) => (
              <Link key={post.title} href={post.href} className="cv-blog-card">
                <p className="cv-blog-meta">
                  {post.date} · {post.readTime} read
                </p>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <span className="cv-blog-read">Read Article</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
