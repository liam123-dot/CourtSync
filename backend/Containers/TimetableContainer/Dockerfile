FROM python:3.9

WORKDIR /app

COPY . .

RUN pip3 install --upgrade pip && pip3 install -r requirements.txt
EXPOSE 8000
CMD ["gunicorn", "-w 3", "app:app", "-b 0.0.0.0:8000"]