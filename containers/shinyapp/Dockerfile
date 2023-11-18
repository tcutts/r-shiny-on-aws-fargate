FROM --platform=linux/amd64 rocker/shiny:4.1.0

# Install R packages.
RUN install2.r -e dplyr

# Remove boilerplate.
RUN rm -rf /srv/shiny-server/

# Copy app.
COPY faithful.R /srv/shiny-server/app.R