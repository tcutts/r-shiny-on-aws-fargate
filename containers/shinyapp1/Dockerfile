FROM --platform=linux/amd64 rocker/shiny:latest

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install R packages
RUN R -e "install.packages(c('dplyr', 'shiny'), repos='https://cloud.r-project.org/')"

RUN mkdir -p /srv/shiny-server/app1
COPY faithful.R /srv/shiny-server/app1/app.R
COPY shiny-server.conf /etc/shiny-server/shiny-server.conf

# Make the app available at port 3838
EXPOSE 3838

# Run the app
CMD ["/usr/bin/shiny-server"]
