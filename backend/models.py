from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
import datetime

class Interaction(Base):
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String, index=True)
    interaction_date = Column(DateTime, default=datetime.datetime.utcnow)
    attendees = Column(String)
    topics = Column(Text)
    materials = Column(Text)
    sentiment = Column(String)
    outcomes = Column(Text)
    follow_up = Column(Text)