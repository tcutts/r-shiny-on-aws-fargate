# Gratuitous dependency (could do this all with base R!).
# from https://datawookie.dev/blog/2021/06/shiny-on-ecs/faithful.R
library(dplyr)
library(shiny)

ui <- fluidPage(
    titlePanel("App 1: Old Faithful Geyser Data"),
    
    sidebarLayout(
        sidebarPanel(
            sliderInput(
                "bins",
                "Number of bins:",
                min = 1,
                max = 50,
                value = 30
            )
        ),
        mainPanel(
            plotOutput("distPlot")
        )
    )
)

server <- function(input, output) {
    output$distPlot <- renderPlot({
        faithful %>%
            pull(waiting) %>%
            hist( 
                breaks = seq(0, 100, length.out = input$bins + 1),
                col = 'darkgray', 
                border = 'white',
                main = NULL
            )
    })
}

shinyApp(ui = ui, server = server)
