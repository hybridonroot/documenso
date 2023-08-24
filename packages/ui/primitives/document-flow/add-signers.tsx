'use client';

import React, { useId } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Document, Field, Recipient, SendStatus } from '@documenso/prisma/client';
import { Button } from '@documenso/ui/primitives/button';
import { FormErrorMessage } from '@documenso/ui/primitives/form/form-error-message';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { TAddSignersFormSchema } from './add-signers.types';
import {
  DocumentFlowFormContainer,
  DocumentFlowFormContainerActions,
  DocumentFlowFormContainerContent,
  DocumentFlowFormContainerFooter,
  DocumentFlowFormContainerStep,
} from './document-flow-root';

export type AddSignersFormProps = {
  recipients: Recipient[];
  fields: Field[];
  document: Document;
  onContinue?: () => void;
  onGoBack?: () => void;
  onSubmit: (_data: TAddSignersFormSchema) => void;
};

export const AddSignersFormPartial = ({
  recipients,
  fields: _fields,
  onGoBack,
  onSubmit,
}: AddSignersFormProps) => {
  const { toast } = useToast();

  const initialId = useId();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TAddSignersFormSchema>({
    defaultValues: {
      signers:
        recipients.length > 0
          ? recipients.map((recipient) => ({
              nativeId: recipient.id,
              formId: String(recipient.id),
              name: recipient.name,
              email: recipient.email,
            }))
          : [
              {
                formId: initialId,
                name: '',
                email: '',
              },
            ],
    },
  });

  const {
    append: appendSigner,
    fields: signers,
    remove: removeSigner,
  } = useFieldArray({
    control,
    name: 'signers',
  });

  const hasBeenSentToRecipientId = (id?: number) => {
    if (!id) {
      return false;
    }

    return recipients.some(
      (recipient) => recipient.id === id && recipient.sendStatus === SendStatus.SENT,
    );
  };

  const onAddSigner = () => {
    appendSigner({
      formId: nanoid(12),
      name: '',
      email: '',
    });
  };

  const onRemoveSigner = (index: number) => {
    const signer = signers[index];

    if (hasBeenSentToRecipientId(signer.nativeId)) {
      toast({
        title: 'Cannot remove signer',
        description: 'This signer has already received the document.',
        variant: 'destructive',
      });

      return;
    }

    removeSigner(index);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      onAddSigner();
    }
  };

  return (
    <DocumentFlowFormContainer onSubmit={handleSubmit(onSubmit)}>
      <DocumentFlowFormContainerContent
        title="Add Signers"
        description="Add the people who will sign the document."
      >
        <div className="flex w-full flex-col gap-y-4">
          <AnimatePresence>
            {signers.map((signer, index) => (
              <motion.div
                key={signer.formId}
                data-native-id={signer.nativeId}
                className="flex flex-wrap items-end gap-x-4"
              >
                <div className="flex-1">
                  <Label htmlFor={`signer-${signer.formId}-email`}>
                    Email
                    <span className="text-destructive ml-1 inline-block font-medium">*</span>
                  </Label>

                  <Controller
                    control={control}
                    name={`signers.${index}.email`}
                    render={({ field }) => (
                      <Input
                        id={`signer-${signer.formId}-email`}
                        type="email"
                        className="bg-background mt-2"
                        disabled={isSubmitting || hasBeenSentToRecipientId(signer.nativeId)}
                        onKeyDown={onKeyDown}
                        {...field}
                      />
                    )}
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor={`signer-${signer.formId}-name`}>Name</Label>

                  <Controller
                    control={control}
                    name={`signers.${index}.name`}
                    render={({ field }) => (
                      <Input
                        id={`signer-${signer.formId}-name`}
                        type="text"
                        className="bg-background mt-2"
                        disabled={isSubmitting || hasBeenSentToRecipientId(signer.nativeId)}
                        onKeyDown={onKeyDown}
                        {...field}
                      />
                    )}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center text-slate-500 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      isSubmitting ||
                      hasBeenSentToRecipientId(signer.nativeId) ||
                      signers.length === 1
                    }
                    onClick={() => onRemoveSigner(index)}
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </div>

                <div className="w-full">
                  <FormErrorMessage className="mt-2" error={errors.signers?.[index]?.email} />
                  <FormErrorMessage className="mt-2" error={errors.signers?.[index]?.name} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <FormErrorMessage className="mt-2" error={errors.signers} />

        <div className="mt-4">
          <Button type="button" disabled={isSubmitting} onClick={() => onAddSigner()}>
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Signer
          </Button>
        </div>
      </DocumentFlowFormContainerContent>

      <DocumentFlowFormContainerFooter>
        <DocumentFlowFormContainerStep title="Add Signers" step={1} maxStep={3} />

        <DocumentFlowFormContainerActions
          loading={isSubmitting}
          disabled={isSubmitting}
          onGoNextClick={() => handleSubmit(onSubmit)()}
          onGoBackClick={onGoBack}
        />
      </DocumentFlowFormContainerFooter>
    </DocumentFlowFormContainer>
  );
};