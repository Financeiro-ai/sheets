# Use the lightweight Nginx Alpine image
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy our static files to the Nginx html directory
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
# Copy the assets directory. Note the trailing slash to ensure it copies into the directory.
COPY assets /usr/share/nginx/html/assets/

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
