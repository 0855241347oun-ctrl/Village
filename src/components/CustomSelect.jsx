import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'เลือก...',
  required = false,
  className = '',
  disabled = false,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // ปิด Dropdown เมื่อคลิกที่อื่น
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    // ส่งอีเวนต์ที่โครงสร้างคล้ายกับ event ปกติของ React onChange
    onChange({ target: { value: val } });
    setIsOpen(false);
  };

  // ดึง label มาแสดง
  const getSelectedLabel = () => {
    if (!value && value !== 0) return placeholder;
    const selected = options.find((opt) => {
      const optVal = typeof opt === 'object' ? opt.value : opt;
      return String(optVal) === String(value);
    });
    
    if (selected) {
      return typeof selected === 'object' ? selected.label : selected;
    }
    return value;
  };

  return (
    <div className={`custom-select-container ${className} ${disabled ? 'disabled' : ''}`} ref={containerRef} style={style}>
      {/* ใช้ hidden input เพื่อรองรับ attribute required สำหรับฟอร์ม */}
      <input 
        type="text" 
        required={required} 
        value={value || ''} 
        onChange={() => {}} 
        style={{ opacity: 0, position: 'absolute', zIndex: -1, pointerEvents: 'none', width: '100%', bottom: 0 }} 
      />
      
      <div
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!value ? 'text-placeholder' : ''}>
          {getSelectedLabel()}
        </span>
        <ChevronDown 
          size={16} 
          className={`custom-select-icon ${isOpen ? 'rotated' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="custom-select-menu">
          {placeholder && (
            <div 
              className={`custom-select-option ${!value ? 'selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              {placeholder}
            </div>
          )}
          {options.map((opt, idx) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            
            return (
              <div
                key={idx}
                className={`custom-select-option ${String(optVal) === String(value) ? 'selected' : ''}`}
                onClick={() => handleSelect(optVal)}
              >
                {optLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
