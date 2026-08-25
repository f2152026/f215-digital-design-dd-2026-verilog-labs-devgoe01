FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y     iverilog     gtkwave     unzip  && curl -fsSL https://raw.githubusercontent.com/phillbush/vcd2svg/master/vcd2svg     -o /usr/local/bin/vcd2svg  && chmod +x /usr/local/bin/vcd2svg  && apt-get clean && rm -rf /var/lib/apt/lists/*
