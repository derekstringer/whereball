/**
 * TimePickerBottomSheet - Set game reminders
 * Two reminder slots: First (default 2hr) + Optional second
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface TimePickerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (offsets: number[]) => void; // offsets in minutes
}

const TIME_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
  { label: '1 day', value: 1440 },
];

export const TimePickerBottomSheet: React.FC<TimePickerBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();
  const [firstReminder, setFirstReminder] = useState(120); // 2 hours default
  const [secondReminderEnabled, setSecondReminderEnabled] = useState(false);
  const [secondReminder, setSecondReminder] = useState(30); // 30 min default
  const [showFirstPicker, setShowFirstPicker] = useState(false);
  const [showSecondPicker, setShowSecondPicker] = useState(false);

  const handleSave = () => {
    const offsets = [firstReminder];
    if (secondReminderEnabled && secondReminder !== firstReminder) {
      offsets.push(secondReminder);
    }
    onSave(offsets);
    onClose();
  };

  const handleCancel = () => {
    // Reset to defaults
    setFirstReminder(120);
    setSecondReminderEnabled(false);
    setSecondReminder(30);
    setShowFirstPicker(false);
    setShowSecondPicker(false);
    onClose();
  };

  const getTimeLabel = (minutes: number) => {
    const option = TIME_OPTIONS.find(o => o.value === minutes);
    return option ? option.label : `${minutes} minutes`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary }]} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Remind Me Before Game Start
          </Text>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* First Reminder */}
            <View style={styles.reminderSection}>
              <Text style={[styles.label, { color: colors.text }]}>First Reminder</Text>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowFirstPicker(!showFirstPicker)}
                activeOpacity={0.7}
              >
                <Text style={[styles.timeButtonText, { color: colors.text }]}>
                  {getTimeLabel(firstReminder)}
                </Text>
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                  {showFirstPicker ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {/* First Reminder Picker */}
              {showFirstPicker && (
                <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {TIME_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        firstReminder === option.value && { backgroundColor: colors.primary + '20' },
                      ]}
                      onPress={() => {
                        setFirstReminder(option.value);
                        setShowFirstPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          { color: firstReminder === option.value ? colors.primary : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {firstReminder === option.value && (
                        <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Second Reminder */}
            <View style={styles.reminderSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                Second Reminder <Text style={{ color: colors.textSecondary }}>(optional)</Text>
              </Text>

              {!secondReminderEnabled ? (
                <TouchableOpacity
                  style={[styles.addButton, { borderColor: colors.border }]}
                  onPress={() => setSecondReminderEnabled(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.addButtonText, { color: colors.textSecondary }]}>
                    + Add
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <TouchableOpacity
                    style={[styles.timeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setShowSecondPicker(!showSecondPicker)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timeButtonText, { color: colors.text }]}>
                      {getTimeLabel(secondReminder)}
                    </Text>
                    <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                      {showSecondPicker ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {/* Second Reminder Picker */}
                  {showSecondPicker && (
                    <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {TIME_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.pickerOption,
                            secondReminder === option.value && { backgroundColor: colors.primary + '20' },
                          ]}
                          onPress={() => {
                            setSecondReminder(option.value);
                            setShowSecondPicker(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              { color: secondReminder === option.value ? colors.primary : colors.text },
                            ]}
                          >
                            {option.label}
                          </Text>
                          {secondReminder === option.value && (
                            <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Remove Second Reminder */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setSecondReminderEnabled(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.removeButtonText, { color: colors.textSecondary }]}>
                      Remove second reminder
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>Save Reminders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 24,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  content: {
    paddingHorizontal: 24,
    maxHeight: 400,
  },
  reminderSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 12,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
  removeButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});
