import { useState } from "react";

export default function ProductImageCarousel({ images = [], alt = "Product image" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const imageList = Array.isArray(images) ? images.filter(Boolean) : [];

  if (imageList.length === 0) {
    return (
      <div className="product-carousel product-gallery-empty">
        <span>📷 No photos</span>
      </div>
    );
  }

  if (imageList.length === 1) {
    return (
      <div className="product-carousel">
        <img
          src={imageList[0]}
          alt={alt}
          className="product-carousel-img"
          loading="lazy"
        />
      </div>
    );
  }

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? imageList.length - 1 : prevIndex - 1));
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === imageList.length - 1 ? 0 : prevIndex + 1));
  };

  const goToSlide = (idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  return (
    <div className="product-carousel">
      <img
        src={imageList[currentIndex]}
        alt={`${alt} (${currentIndex + 1} of ${imageList.length})`}
        className="product-carousel-img"
        loading="lazy"
      />

      <button
        type="button"
        className="carousel-btn prev"
        onClick={prev}
        aria-label="Previous image"
      >
        ‹
      </button>

      <button
        type="button"
        className="carousel-btn next"
        onClick={next}
        aria-label="Next image"
      >
        ›
      </button>

      <div className="carousel-indicators">
        {imageList.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`carousel-dot ${idx === currentIndex ? "active" : ""}`}
            onClick={(e) => goToSlide(idx, e)}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>

      <span className="carousel-counter">
        {currentIndex + 1} / {imageList.length}
      </span>
    </div>
  );
}

