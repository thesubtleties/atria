#!/bin/bash

# Create directories if they don't exist
mkdir -p src/pages/Landing/Testimonial/styles
mkdir -p src/pages/Landing/Stats/styles

# Create Testimonial CSS files
cat > src/pages/Landing/Testimonial/styles/TestimonialImage.module.css << EOL
.imageWrapper {
  flex-shrink: 0;
  width: 400px;
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .imageWrapper {
    width: 100%;
    height: 200px;
  }
}
EOL

cat > src/pages/Landing/Testimonial/styles/TestimonialContent.module.css << EOL
.content {
  padding: 2rem;
}

.quote {
  font-size: 1.25rem;
  font-style: italic;
  color: #1a1b1e;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.author {
  font-weight: 600;
  color: #1a1b1e;
  margin: 0;
}

.role {
  color: #666;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }
  
  .quote {
    font-size: 1.125rem;
  }
}
EOL

cat > src/pages/Landing/Testimonial/styles/TestimonialCard.module.css << EOL
.card {
  display: flex;
  align-items: center;
  gap: 4rem;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .card {
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
  }
}
EOL

# Create Stats CSS files
cat > src/pages/Landing/Stats/styles/StatItem.module.css << EOL
.statItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  text-align: center;
}

.value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1b1e;
  margin: 0;
}

.label {
  font-size: 1rem;
  color: #666;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .value {
    font-size: 2rem;
  }
}
EOL

cat > src/pages/Landing/Stats/styles/StatsList.module.css << EOL
.statsList {
  display: flex;
  justify-content: center;
  gap: 4rem;
  padding: 2rem;
}

@media (max-width: 768px) {
  .statsList {
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
  }
}
EOL

echo "CSS module files have been created!"